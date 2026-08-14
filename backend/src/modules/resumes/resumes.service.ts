import { createHash } from "crypto";
import path from "path";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { logger } from "../../utils/logger";
import { storageProvider } from "../../storage";
import { aiProvider } from "../../ai";
import { extractResumeText } from "./resumes.extract";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]); // "%PDF"
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // DOCX is a zip container

type UploadedFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

function validateFile(file: UploadedFile): ".pdf" | ".docx" {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw ApiError.tooLarge("Resume files must be under 5MB");
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw ApiError.unsupportedMedia("Only .pdf and .docx resumes are supported");
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw ApiError.unsupportedMedia("Unrecognized file type");
  }

  const header = file.buffer.subarray(0, 4);
  const magic = ext === ".pdf" ? PDF_MAGIC : ZIP_MAGIC;
  if (!header.equals(magic)) {
    throw ApiError.unsupportedMedia("The uploaded file does not look like a valid " + ext.slice(1).toUpperCase());
  }

  return ext as ".pdf" | ".docx";
}

async function runResumeAnalysis(resumeId: string, buffer: Buffer, extension: ".pdf" | ".docx") {
  try {
    const text = await extractResumeText(buffer, extension);
    if (!text || text.length < 20) {
      throw ApiError.badRequest("Could not extract readable text from this file");
    }

    const parsed = await aiProvider.parseResume(text);

    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        extractedText: text,
        parsedData: parsed as unknown as Prisma.InputJsonValue,
        parseStatus: "COMPLETED",
        parseError: null,
      },
    });

    await prisma.resumeAnalysis.create({
      data: {
        resumeId,
        aiModel: aiProvider.modelName,
        aiVersion: "1",
        rawResponse: parsed as unknown as Prisma.InputJsonValue,
        status: "COMPLETED",
      },
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Resume analysis failed unexpectedly";
    logger.warn("Resume analysis failed", { resumeId, message });

    await prisma.resume.update({
      where: { id: resumeId },
      data: { parseStatus: "FAILED", parseError: message },
    });
    await prisma.resumeAnalysis.create({
      data: {
        resumeId,
        aiModel: aiProvider.modelName,
        aiVersion: "1",
        rawResponse: {},
        status: "FAILED",
        errorMessage: message,
      },
    });
  }
}

export async function uploadResume(candidateUserId: string, file: UploadedFile) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  if (!candidate) throw ApiError.notFound("Candidate profile not found");

  const extension = validateFile(file);
  const storageKey = await storageProvider.save(file.buffer, extension, file.mimetype);
  const fileHash = createHash("sha256").update(file.buffer).digest("hex");

  const resume = await prisma.resume.create({
    data: {
      candidateId: candidate.id,
      storageKey,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileHash,
      parseStatus: "PROCESSING",
    },
  });

  await runResumeAnalysis(resume.id, file.buffer, extension);

  return prisma.resume.findUniqueOrThrow({ where: { id: resume.id } });
}

export async function retryResumeAnalysis(resumeId: string, candidateUserId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  if (!candidate) throw ApiError.notFound("Candidate profile not found");

  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume || resume.candidateId !== candidate.id) throw ApiError.notFound("Resume not found");

  const buffer = await storageProvider.read(resume.storageKey);
  const extension = path.extname(resume.originalFilename).toLowerCase() as ".pdf" | ".docx";

  await prisma.resume.update({ where: { id: resumeId }, data: { parseStatus: "PROCESSING" } });
  await runResumeAnalysis(resumeId, buffer, extension);

  return prisma.resume.findUniqueOrThrow({ where: { id: resumeId } });
}

export async function listMyResumes(candidateUserId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  if (!candidate) throw ApiError.notFound("Candidate profile not found");

  return prisma.resume.findMany({
    where: { candidateId: candidate.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getResumeForCandidate(resumeId: string, candidateUserId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!candidate || !resume || resume.candidateId !== candidate.id) {
    throw ApiError.notFound("Resume not found");
  }
  return resume;
}

// Recruiters only ever reach a resume through an application to one of their
// company's jobs — never a bare resumeId lookup.
export async function getResumeForCompany(resumeId: string, companyId: string) {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { applications: { where: { job: { companyId } }, select: { id: true } } },
  });
  if (!resume || resume.applications.length === 0) throw ApiError.notFound("Resume not found");
  return resume;
}

// Interviewers only reach a resume through an interview they're personally
// assigned to — never bare company-wide access like a recruiter has.
export async function getResumeForInterviewer(resumeId: string, interviewerId: string) {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      applications: {
        where: { interviews: { some: { interviewerId } } },
        select: { id: true },
      },
    },
  });
  if (!resume || resume.applications.length === 0) throw ApiError.notFound("Resume not found");
  return resume;
}

export async function getResumeFile(resume: { storageKey: string }) {
  return storageProvider.read(resume.storageKey);
}

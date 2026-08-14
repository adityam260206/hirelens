import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type { CreateOfferInput, UpdateOfferInput } from "./offers.schemas";

const OFFER_INCLUDE = {
  application: {
    include: {
      job: { select: { id: true, title: true, companyId: true, company: { select: { name: true } } } },
      candidate: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
    },
  },
} satisfies Prisma.OfferLetterInclude;

export async function createOffer(companyId: string, applicationId: string, input: CreateOfferInput) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: { select: { companyId: true } }, offer: true },
  });
  if (!application || application.job.companyId !== companyId) throw ApiError.notFound("Application not found");
  if (application.status === "REJECTED" || application.status === "HIRED") {
    throw ApiError.conflict(`Cannot create an offer for an application marked ${application.status}`);
  }
  if (application.offer) throw ApiError.conflict("An offer already exists for this application");

  return prisma.$transaction(async (tx) => {
    const offer = await tx.offerLetter.create({
      data: { applicationId, ...input },
      include: OFFER_INCLUDE,
    });
    // Creating an offer is an authoritative recruiter action — it moves the
    // application to the Offer stage regardless of the strict pipeline order,
    // unlike a drag-and-drop Kanban move.
    await tx.application.update({ where: { id: applicationId }, data: { status: "OFFER" } });
    return offer;
  });
}

async function getOfferOr404(id: string) {
  const offer = await prisma.offerLetter.findUnique({ where: { id }, include: OFFER_INCLUDE });
  if (!offer) throw ApiError.notFound("Offer not found");
  return offer;
}

export async function getOfferForCompany(id: string, companyId: string) {
  const offer = await getOfferOr404(id);
  if (offer.application.job.companyId !== companyId) throw ApiError.notFound("Offer not found");
  return offer;
}

export async function getOfferForCandidate(id: string, candidateUserId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  const offer = await getOfferOr404(id);
  if (!candidate || offer.application.candidateId !== candidate.id) throw ApiError.notFound("Offer not found");
  return offer;
}

export async function updateOffer(id: string, companyId: string, input: UpdateOfferInput) {
  const offer = await getOfferOr404(id);
  if (offer.application.job.companyId !== companyId) throw ApiError.notFound("Offer not found");
  if (offer.status !== "DRAFT") throw ApiError.conflict("Only draft offers can be edited");

  return prisma.offerLetter.update({ where: { id }, data: input, include: OFFER_INCLUDE });
}

export async function sendOffer(id: string, companyId: string) {
  const offer = await getOfferOr404(id);
  if (offer.application.job.companyId !== companyId) throw ApiError.notFound("Offer not found");
  if (offer.status !== "DRAFT") throw ApiError.conflict("Only draft offers can be sent");

  return prisma.offerLetter.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date() },
    include: OFFER_INCLUDE,
  });
}

export async function withdrawOffer(id: string, companyId: string) {
  const offer = await getOfferOr404(id);
  if (offer.application.job.companyId !== companyId) throw ApiError.notFound("Offer not found");
  if (offer.status !== "SENT") throw ApiError.conflict("Only sent offers can be withdrawn");

  return prisma.offerLetter.update({
    where: { id },
    data: { status: "WITHDRAWN" },
    include: OFFER_INCLUDE,
  });
}

export async function acceptOffer(id: string, candidateUserId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  const offer = await getOfferOr404(id);
  if (!candidate || offer.application.candidateId !== candidate.id) throw ApiError.notFound("Offer not found");
  if (offer.status !== "SENT") throw ApiError.conflict("Only sent offers can be accepted");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.offerLetter.update({
      where: { id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
      include: OFFER_INCLUDE,
    });
    await tx.application.update({ where: { id: offer.applicationId }, data: { status: "HIRED" } });
    return updated;
  });
}

export async function rejectOffer(id: string, candidateUserId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { userId: candidateUserId } });
  const offer = await getOfferOr404(id);
  if (!candidate || offer.application.candidateId !== candidate.id) throw ApiError.notFound("Offer not found");
  if (offer.status !== "SENT") throw ApiError.conflict("Only sent offers can be rejected");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.offerLetter.update({
      where: { id },
      data: { status: "REJECTED", respondedAt: new Date() },
      include: OFFER_INCLUDE,
    });
    await tx.application.update({ where: { id: offer.applicationId }, data: { status: "REJECTED" } });
    return updated;
  });
}

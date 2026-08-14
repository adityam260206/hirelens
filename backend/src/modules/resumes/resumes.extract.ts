import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { ApiError } from "../../utils/ApiError";

export async function extractResumeText(buffer: Buffer, extension: ".pdf" | ".docx"): Promise<string> {
  try {
    if (extension === ".pdf") {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return result.text.trim();
      } finally {
        await parser.destroy();
      }
    }

    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch {
    throw ApiError.badRequest("Could not read this file — it may be corrupted or password-protected");
  }
}

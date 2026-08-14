import { prisma } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import type { UpdateCompanyInput } from "./companies.schemas";

export async function getCompanyById(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw ApiError.notFound("Company not found");
  return company;
}

export async function updateCompany(companyId: string, input: UpdateCompanyInput) {
  return prisma.company.update({ where: { id: companyId }, data: input });
}

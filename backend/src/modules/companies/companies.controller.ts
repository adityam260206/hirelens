import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/apiResponse";
import { logActivity } from "../../utils/activityLog";
import { updateCompanySchema } from "./companies.schemas";
import * as companiesService from "./companies.service";

export const getMyCompany = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const company = await companiesService.getCompanyById(req.user!.companyId);
  return ok(res, company);
});

export const updateMyCompany = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const input = updateCompanySchema.parse(req.body);
  const company = await companiesService.updateCompany(req.user!.companyId, input);
  await logActivity({
    userId: req.user!.id,
    action: "COMPANY_UPDATED",
    entityType: "Company",
    entityId: company.id,
  });
  return ok(res, company);
});

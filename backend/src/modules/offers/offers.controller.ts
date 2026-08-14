import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, ok } from "../../utils/apiResponse";
import { requireParam } from "../../utils/params";
import { logActivity } from "../../utils/activityLog";
import { createOfferSchema, updateOfferSchema } from "./offers.schemas";
import * as offersService from "./offers.service";

export const createOffer = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const applicationId = requireParam(req, "id");
  const input = createOfferSchema.parse(req.body);
  const offer = await offersService.createOffer(req.user!.companyId, applicationId, input);
  await logActivity({ userId: req.user!.id, action: "OFFER_CREATED", entityType: "OfferLetter", entityId: offer.id });
  return created(res, offer);
});

export const getOffer = asyncHandler(async (req, res) => {
  const id = requireParam(req, "id");

  if (req.user!.role === "CANDIDATE") {
    const offer = await offersService.getOfferForCandidate(id, req.user!.id);
    return ok(res, offer);
  }

  // Compensation details are recruiter-only — interviewers have a companyId
  // too, but must not fall into this branch just because of that.
  if (req.user!.role !== "RECRUITER" || !req.user!.companyId) {
    throw ApiError.forbidden();
  }
  const offer = await offersService.getOfferForCompany(id, req.user!.companyId);
  return ok(res, offer);
});

export const updateOffer = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const id = requireParam(req, "id");
  const input = updateOfferSchema.parse(req.body);
  const offer = await offersService.updateOffer(id, req.user!.companyId, input);
  return ok(res, offer);
});

export const sendOffer = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const id = requireParam(req, "id");
  const offer = await offersService.sendOffer(id, req.user!.companyId);
  await logActivity({ userId: req.user!.id, action: "OFFER_SENT", entityType: "OfferLetter", entityId: id });
  return ok(res, offer);
});

export const withdrawOffer = asyncHandler(async (req, res) => {
  if (!req.user!.companyId) throw ApiError.forbidden("No company associated with this account");
  const id = requireParam(req, "id");
  const offer = await offersService.withdrawOffer(id, req.user!.companyId);
  await logActivity({ userId: req.user!.id, action: "OFFER_WITHDRAWN", entityType: "OfferLetter", entityId: id });
  return ok(res, offer);
});

export const acceptOffer = asyncHandler(async (req, res) => {
  const id = requireParam(req, "id");
  const offer = await offersService.acceptOffer(id, req.user!.id);
  await logActivity({ userId: req.user!.id, action: "OFFER_ACCEPTED", entityType: "OfferLetter", entityId: id });
  return ok(res, offer);
});

export const rejectOffer = asyncHandler(async (req, res) => {
  const id = requireParam(req, "id");
  const offer = await offersService.rejectOffer(id, req.user!.id);
  await logActivity({ userId: req.user!.id, action: "OFFER_REJECTED", entityType: "OfferLetter", entityId: id });
  return ok(res, offer);
});

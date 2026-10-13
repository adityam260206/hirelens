import { describe, it, expect, vi } from "vitest";
import { requireRole } from "../rbac";
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../../utils/ApiError";

describe("Role-Based Access Control (RBAC) Middleware", () => {
  const mockResponse = {} as Response;

  it("yields 401 Unauthorized if request has no authenticated user", () => {
    const middleware = requireRole("RECRUITER");
    const req = {} as Request;
    const next = vi.fn();

    middleware(req, mockResponse, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
  });

  it("yields 403 Forbidden if user role is not allowed", () => {
    const middleware = requireRole("RECRUITER");
    const req = {
      user: {
        id: "cand-123",
        email: "cand@example.com",
        role: "CANDIDATE",
      },
    } as unknown as Request;
    const next = vi.fn();

    middleware(req, mockResponse, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(403);
  });

  it("allows access when user has an permitted role", () => {
    const middleware = requireRole("RECRUITER", "INTERVIEWER");
    const req = {
      user: {
        id: "rec-123",
        email: "rec@example.com",
        role: "RECRUITER",
      },
    } as unknown as Request;
    const next = vi.fn();

    middleware(req, mockResponse, next);

    expect(next).toHaveBeenCalledWith();
  });
});

import type { Request } from "express";
import { ApiError } from "./ApiError";

// Express 5's ParamsDictionary types values as `string | string[]` to allow
// repeated wildcard segments; every route param we use is a single named
// segment (e.g. `:id`), so this narrows it back to the string we expect.
export function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw ApiError.badRequest(`Missing route parameter: ${name}`);
  }
  return value;
}

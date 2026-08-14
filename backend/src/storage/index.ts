import { env } from "../config/env";
import { localStorageProvider } from "./localStorageProvider";
import type { StorageProvider } from "./provider";

function selectProvider(): StorageProvider {
  switch (env.STORAGE_DRIVER) {
    case "local":
      return localStorageProvider;
    case "cloudinary":
      // Env validation requires real Cloudinary credentials in production
      // before this driver can be selected; the adapter itself isn't wired
      // up yet. Fails loudly rather than silently falling back to disk.
      throw new Error("STORAGE_DRIVER=cloudinary is not implemented yet — use STORAGE_DRIVER=local");
  }
}

export const storageProvider: StorageProvider = selectProvider();
export type { StorageProvider } from "./provider";

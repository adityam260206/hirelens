// Abstraction over private file storage so the driver can be swapped (local
// disk in dev, Cloudinary/S3-equivalent in production) without touching
// calling code. storageKey is always server-generated — never derived from
// user-supplied filenames.
export interface StorageProvider {
  save(buffer: Buffer, extension: string, mimeType: string): Promise<string>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

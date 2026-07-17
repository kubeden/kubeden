import { S3Client } from "@aws-sdk/client-s3";

let instance: S3Client | null = null;

/**
 * Neon Object Storage is S3-compatible. The SDK reads AWS_ACCESS_KEY_ID,
 * AWS_SECRET_ACCESS_KEY and AWS_REGION from the environment; the endpoint
 * override points it at Neon instead of AWS.
 */
export function getStorage(): S3Client {
  return (instance ??= new S3Client({
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true,
  }));
}

/** Bucket name is passed per call — the SDK does not read it from env. */
export const STORAGE_BUCKET = process.env.AWS_S3_BUCKET ?? "";

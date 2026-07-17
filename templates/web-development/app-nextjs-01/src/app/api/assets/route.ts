/**
 * Upload seam for Neon Object Storage: a later stage implements presigned-URL
 * issuance here (getStorage() + @aws-sdk/s3-request-presigner) and records
 * metadata in the `assets` table.
 */
export async function POST() {
  return Response.json(
    { error: "Not implemented — object-storage upload seam for a later stage." },
    { status: 501 },
  );
}

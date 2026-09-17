import { put, del, get } from "@vercel/blob";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";

// Vercel Blob token
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

// Cloudflare R2 configuration
const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const r2AccessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const r2SecretKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "ai-reviewer-documents";

const isBlobConfigured = Boolean(blobToken);
const isR2Configured = Boolean(
  r2AccountId && r2AccessKey && r2SecretKey && r2BucketName
);

let s3Client: S3Client | null = null;
if (isR2Configured) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKey!,
      secretAccessKey: r2SecretKey!,
    },
  });
}

export const storage = {
  isConfigured(): boolean {
    return isBlobConfigured || isR2Configured;
  },

  getProvider(): "vercel-blob" | "cloudflare-r2" | "none" {
    if (isBlobConfigured) return "vercel-blob";
    if (isR2Configured) return "cloudflare-r2";
    return "none";
  },

  generateStorageKey(userId: string, originalFileName: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(6).toString("hex");
    const cleanName = originalFileName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .toLowerCase();
    return `users/${userId}/${timestamp}_${random}_${cleanName}`;
  },

  async upload(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<{ storageKey: string }> {
    // 1. Primary: Vercel Blob (supports both public and private stores)
    if (isBlobConfigured) {
      try {
        const blob = await put(key, buffer, {
          access: "public",
          contentType: contentType || "application/octet-stream",
          token: blobToken,
        });
        return { storageKey: blob.url };
      } catch (err: any) {
        // If the Vercel Blob store is configured with private access
        if (
          err?.message?.includes("private store") ||
          err?.message?.includes("private access")
        ) {
          const blob = await put(key, buffer, {
            access: "private",
            contentType: contentType || "application/octet-stream",
            token: blobToken,
          });
          return { storageKey: blob.url };
        }
        throw err;
      }
    }

    // 2. Secondary: Cloudflare R2
    if (isR2Configured && s3Client) {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: r2BucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      return { storageKey: key };
    }

    throw new Error(
      "No object storage configured. Set BLOB_READ_WRITE_TOKEN (for Vercel Blob) or Cloudflare R2 credentials (CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME) in your environment variables."
    );
  },

  async download(key: string): Promise<Buffer> {
    // 1. If Vercel Blob is configured or it's a full URL
    if (isBlobConfigured || key.startsWith("http://") || key.startsWith("https://")) {
      // First attempt direct fetch (works for public blobs)
      try {
        const response = await fetch(key);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch {}

      // If direct fetch fails or store is private, use @vercel/blob get()
      if (isBlobConfigured) {
        try {
          const getRes = await get(key, {
            access: "private",
            token: blobToken,
          });
          if (getRes && getRes.stream) {
            const reader = getRes.stream.getReader();
            const chunks: Uint8Array[] = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) chunks.push(value);
            }
            return Buffer.concat(chunks);
          }
        } catch (err) {
          console.error("Vercel Blob private get failed:", err);
        }
      }
    }

    // 2. Cloudflare R2
    if (isR2Configured && s3Client) {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: r2BucketName,
          Key: key,
        })
      );
      if (!response.Body) {
        throw new Error(`File ${key} not found in R2 storage.`);
      }
      const streamToBuffer = async (stream: any): Promise<Buffer> => {
        const chunks: any[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      };
      return streamToBuffer(response.Body);
    }

    throw new Error("No object storage configured or file not found.");
  },

  async delete(key: string): Promise<boolean> {
    try {
      if (key.startsWith("http://") || key.startsWith("https://") || isBlobConfigured) {
        await del(key, { token: blobToken });
        return true;
      }

      if (isR2Configured && s3Client) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: r2BucketName,
            Key: key,
          })
        );
        return true;
      }

      return false;
    } catch (err) {
      console.error("Storage delete error:", err);
      return false;
    }
  },
};

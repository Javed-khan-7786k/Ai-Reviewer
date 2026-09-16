import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const r2AccessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const r2SecretKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "ai-reviewer-documents";

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

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), ".storage", "uploads");

function ensureLocalUploadsDir() {
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
}

export const storage = {
  isConfigured(): boolean {
    return isR2Configured;
  },

  generateStorageKey(userId: string, originalFileName: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(6).toString("hex");
    // sanitize file name: remove non-alphanumeric except dots and dashes
    const cleanName = path
      .basename(originalFileName)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .toLowerCase();

    return `users/${userId}/${timestamp}_${random}_${cleanName}`;
  },

  async upload(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<{ storageKey: string }> {
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

    // Local file storage fallback
    ensureLocalUploadsDir();
    // Use hash or encoded path to prevent traversal
    const safeLocalPath = path.join(
      LOCAL_UPLOADS_DIR,
      key.replace(/[^a-zA-Z0-9._-]/g, "_")
    );
    await fs.promises.writeFile(safeLocalPath, buffer);
    return { storageKey: key };
  },

  async download(key: string): Promise<Buffer> {
    if (isR2Configured && s3Client) {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: r2BucketName,
          Key: key,
        })
      );
      if (!response.Body) {
        throw new Error(`File ${key} not found in storage.`);
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

    // Local file storage fallback
    ensureLocalUploadsDir();
    const safeLocalPath = path.join(
      LOCAL_UPLOADS_DIR,
      key.replace(/[^a-zA-Z0-9._-]/g, "_")
    );
    if (!fs.existsSync(safeLocalPath)) {
      throw new Error(`Local file not found for key: ${key}`);
    }
    return fs.promises.readFile(safeLocalPath);
  },

  async delete(key: string): Promise<boolean> {
    try {
      if (isR2Configured && s3Client) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: r2BucketName,
            Key: key,
          })
        );
        return true;
      }

      ensureLocalUploadsDir();
      const safeLocalPath = path.join(
        LOCAL_UPLOADS_DIR,
        key.replace(/[^a-zA-Z0-9._-]/g, "_")
      );
      if (fs.existsSync(safeLocalPath)) {
        await fs.promises.unlink(safeLocalPath);
      }
      return true;
    } catch {
      return false;
    }
  },
};

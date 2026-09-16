import { z } from "zod";

// 1. Authentication Schemas (Formik / Joi / Zod style)
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginValidationSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address")
    .regex(emailRegex, "Invalid email structure"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
  rememberMe: z.boolean().optional(),
});

export const signupValidationSchema = z.object({
  name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(60, "Full name must not exceed 60 characters"),
  email: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address")
    .regex(emailRegex, "Invalid email structure"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password is too long"),
});

// 2. Document Upload & Rate Limiting Schema
export const documentUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  mimeType: z.string().min(1, "File MIME type is required"),
  fileSize: z.number().positive("File must not be empty"),
  documentType: z.enum(["resume", "general"]).default("general"),
});

// 3. Admin Payment Keys & Config Schema
export const adminConfigValidationSchema = z.object({
  fullAppFree: z.boolean(),
  requireLogin: z.boolean(),
  subscriptionsEnabled: z.boolean(),
  activePaymentGateway: z.enum(["stripe", "razorpay", "paypal", "demo"]),
  paymentTestMode: z.boolean(),
  rateLimits: z.object({
    maxUploadsPerMinute: z.number().min(1).max(100),
    maxDailyUploadsFree: z.number().min(1).max(500),
    maxDailyUploadsPro: z.number().min(5).max(5000),
    maxDailyRewritesFree: z.number().min(1).max(1000),
    maxDailyRewritesPro: z.number().min(10).max(10000),
    maxFileSizeMB: z.number().min(1).max(100),
  }),
});

// 4. Mongoose-style In-Memory / DB Validators
export class MongooseValidationError extends Error {
  errors: Record<string, string>;
  constructor(message: string, errors: Record<string, string> = {}) {
    super(message);
    this.name = "MongooseValidationError";
    this.errors = errors;
  }
}

export function validateUserDocument(data: any) {
  const errors: Record<string, string> = {};
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = "Invalid or missing email address.";
  }
  if (data.plan && !["free", "pro"].includes(data.plan)) {
    errors.plan = `Invalid plan value '${data.plan}'. Allowed values: free, pro.`;
  }
  if (Object.keys(errors).length > 0) {
    throw new MongooseValidationError("User document validation failed", errors);
  }
}

export function validateDocumentRecord(data: any) {
  const errors: Record<string, string> = {};
  if (!data.fileName || typeof data.fileName !== "string" || data.fileName.trim().length === 0) {
    errors.fileName = "Document fileName is required.";
  }
  if (!data.userId) {
    errors.userId = "Document must belong to a valid userId.";
  }
  if (data.status && !["pending", "processing", "completed", "failed"].includes(data.status)) {
    errors.status = `Invalid document status '${data.status}'.`;
  }
  if (data.documentType && !["resume", "general"].includes(data.documentType)) {
    errors.documentType = `Invalid documentType '${data.documentType}'.`;
  }
  if (Object.keys(errors).length > 0) {
    throw new MongooseValidationError("Document record validation failed", errors);
  }
}

import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const createLeadSchema = z.object({
  customerId: z.string().uuid(),
  websiteId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  company: optionalText,
  message: z.string().trim().min(1).max(10000),
  source: z.string().trim().max(100).default("website"),
  pageUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  _gotcha: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const customerInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  companyName: z.string().trim().min(1).max(200),
  contactName: z.string().trim().min(1).max(200),
  contactEmail: z.string().trim().email().max(320),
  contactPhone: z.string().trim().max(50).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const websiteInputSchema = z.object({
  customerId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  domain: z.string().trim().min(1).max(255),
  status: z.enum(["active", "inactive", "error"]).default("active"),
  active: z.boolean().default(true),
});

export const leadPatchSchema = z.object({
  status: z
    .enum(["new", "in_progress", "waiting", "replied", "qualified", "closed", "spam"])
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const mailSendSchema = z.object({
  to: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1).max(20000),
  host: z.string().trim().max(255).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  username: z.string().trim().email().max(320).optional(),
  password: z.string().max(400).optional(),
  fromName: z.string().trim().max(120).optional(),
});

export const mailTestSchema = z.object({
  host: z.string().trim().max(255).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  username: z.string().trim().email().max(320).optional(),
  password: z.string().max(400).optional(),
  fromName: z.string().trim().max(120).optional(),
});

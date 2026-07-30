import { z } from "zod";

export const studentProfileSchema = z
  .object({
    address: z.string().nullable(),
    avatarRevision: z.string().nullable(),
    birthDate: z.string().nullable(),
    email: z.string().email(),
    gender: z.string().nullable(),
    guardianDocument: z.string().nullable(),
    hasAvatar: z.boolean(),
    level: z.string().nullable(),
    motherName: z.string().nullable(),
    motherPhone: z.string().nullable(),
    name: z.string().min(1),
    notes: z.string().nullable(),
    phone: z.string().nullable(),
    studentPhone: z.string().nullable(),
    studentPhoneAlt: z.string().nullable(),
  })
  .strict();

export const studentProfileResponseSchema = z
  .object({
    ok: z.literal(true),
    profile: studentProfileSchema,
  })
  .strict();

export const studentProfileUpdateResponseSchema =
  studentProfileResponseSchema.extend({
    message: z.string().min(1),
  });

export const avatarUploadResponseSchema = z
  .object({
    avatarRevision: z.string().nullable(),
    message: z.string().min(1),
    ok: z.literal(true),
  })
  .strict();

export type MobileStudentProfile = z.infer<typeof studentProfileSchema>;

export type MobileStudentProfileUpdate = {
  address?: string;
  birthDate?: string;
  gender?: string;
  guardianDocument?: string;
  motherName?: string;
  motherPhone?: string;
  name: string;
  notes?: string;
  phone?: string;
  studentPhone?: string;
  studentPhoneAlt?: string;
};

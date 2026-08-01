import { z } from "zod";

const adminUserRoleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT"]);

const adminUserListItemSchema = z
  .object({
    createdAt: z.string().datetime(),
    email: z.string().min(1).max(254),
    id: z.string().min(1).max(200),
    isActive: z.boolean(),
    name: z.string().min(1).max(120),
    profileComplete: z.boolean(),
    role: adminUserRoleSchema,
    updatedAt: z.string().datetime(),
  })
  .strict();

const adminUserListSchema = z
  .object({
    generatedAt: z.string().datetime(),
    items: z.array(adminUserListItemSchema).max(50),
    nextCursor: z.string().min(1).max(200).nullable(),
    total: z.number().int().nonnegative(),
  })
  .strict();

const adminStudentProfileSchema = z
  .object({
    contractsCount: z.number().int().nonnegative(),
    id: z.string().min(1).max(200),
    lessonsCount: z.number().int().nonnegative(),
    level: z.string().min(1).max(80).nullable(),
    submissionsCount: z.number().int().nonnegative(),
    teacherNames: z.array(z.string().min(1).max(120)).max(20),
  })
  .strict();

const adminTeacherProfileSchema = z
  .object({
    bio: z.string().min(1).max(500).nullable(),
    homeworksCount: z.number().int().nonnegative(),
    id: z.string().min(1).max(200),
    lessonsCount: z.number().int().nonnegative(),
    reviewedSubmissionsCount: z.number().int().nonnegative(),
    studentsCount: z.number().int().nonnegative(),
  })
  .strict();

const adminUserDetailSchema = z
  .object({
    address: z.string().min(1).max(240).nullable(),
    createdAt: z.string().datetime(),
    email: z.string().min(1).max(254),
    id: z.string().min(1).max(200),
    isActive: z.boolean(),
    name: z.string().min(1).max(120),
    phone: z.string().min(1).max(40).nullable(),
    role: adminUserRoleSchema,
    studentProfile: adminStudentProfileSchema.nullable(),
    teacherProfile: adminTeacherProfileSchema.nullable(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const adminUsersResponseSchema = z
  .object({
    ok: z.literal(true),
    users: adminUserListSchema,
  })
  .strict();

export const adminUserResponseSchema = z
  .object({
    ok: z.literal(true),
    user: adminUserDetailSchema,
  })
  .strict();

export type MobileAdminUserList = z.infer<typeof adminUserListSchema>;
export type MobileAdminUserListItem = z.infer<
  typeof adminUserListItemSchema
>;
export type MobileAdminUserDetail = z.infer<typeof adminUserDetailSchema>;
export type MobileAdminUserRole = z.infer<typeof adminUserRoleSchema>;

export type AdminUsersInput = {
  cursor?: string;
  limit?: number;
  query?: string;
  role?: MobileAdminUserRole;
  status?: "ACTIVE" | "INACTIVE" | "ALL";
};

import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT"]);

export const authUserSchema = z
  .object({
    email: z.string().email(),
    id: z.string().min(1),
    name: z.string().min(1),
    role: roleSchema,
  })
  .strict();

export const authTokensSchema = z
  .object({
    accessExpiresAt: z.string().datetime(),
    accessToken: z.string().min(1),
    refreshExpiresAt: z.string().datetime(),
    refreshToken: z.string().min(1),
    tokenType: z.literal("Bearer"),
  })
  .strict();

export const authSessionSchema = z
  .object({
    tokens: authTokensSchema,
    user: authUserSchema,
  })
  .strict();

export type AuthSession = z.infer<typeof authSessionSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type Role = z.infer<typeof roleSchema>;

export type AuthSessionStore = {
  clear: () => Promise<void>;
  get: () => Promise<AuthSession | null>;
  save: (session: AuthSession) => Promise<void>;
};

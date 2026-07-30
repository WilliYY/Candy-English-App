import { z } from "zod";

import type { MobileStudentProfile } from "@/lib/api/mobile-api-client";

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message);

export const profileFormSchema = z.object({
  address: optionalText(
    300,
    "O endereço pode ter no máximo 300 caracteres.",
  ),
  birthDate: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) {
        return true;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    }, "Informe a data no formato AAAA-MM-DD."),
  gender: optionalText(
    40,
    "A identificação pode ter no máximo 40 caracteres.",
  ),
  guardianDocument: optionalText(
    180,
    "O documento ou responsável pode ter no máximo 180 caracteres.",
  ),
  motherName: optionalText(
    120,
    "O nome do responsável pode ter no máximo 120 caracteres.",
  ),
  motherPhone: optionalText(
    40,
    "O telefone do responsável pode ter no máximo 40 caracteres.",
  ),
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(120, "O nome pode ter no máximo 120 caracteres."),
  notes: optionalText(
    1000,
    "As observações podem ter no máximo 1000 caracteres.",
  ),
  phone: optionalText(
    40,
    "O telefone pode ter no máximo 40 caracteres.",
  ),
  studentPhone: optionalText(
    40,
    "O telefone principal pode ter no máximo 40 caracteres.",
  ),
  studentPhoneAlt: optionalText(
    40,
    "O telefone secundário pode ter no máximo 40 caracteres.",
  ),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const emptyProfileForm: ProfileFormValues = {
  address: "",
  birthDate: "",
  gender: "",
  guardianDocument: "",
  motherName: "",
  motherPhone: "",
  name: "",
  notes: "",
  phone: "",
  studentPhone: "",
  studentPhoneAlt: "",
};

export function profileToFormValues(
  profile: MobileStudentProfile,
): ProfileFormValues {
  return {
    address: profile.address ?? "",
    birthDate: profile.birthDate ?? "",
    gender: profile.gender ?? "",
    guardianDocument: profile.guardianDocument ?? "",
    motherName: profile.motherName ?? "",
    motherPhone: profile.motherPhone ?? "",
    name: profile.name,
    notes: profile.notes ?? "",
    phone: profile.phone ?? "",
    studentPhone: profile.studentPhone ?? "",
    studentPhoneAlt: profile.studentPhoneAlt ?? "",
  };
}

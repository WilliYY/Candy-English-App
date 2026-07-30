import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { ProfileScreen } from "@/features/profile/profile-screen";
import type { MobileStudentProfile } from "@/lib/api/mobile-api-client";

jest.mock("@/lib/files/avatar-upload", () => ({
  pickAvatarForUpload: jest.fn(async () => null),
  removeAvatarUploadTemp: jest.fn(async () => undefined),
}));

const profile: MobileStudentProfile = {
  address: "Rua Candy, 10",
  avatarRevision: null,
  birthDate: "2010-05-20",
  email: "student@candy.example",
  gender: "",
  guardianDocument: "",
  hasAvatar: false,
  level: "A2",
  motherName: "Maria",
  motherPhone: "44999999999",
  name: "Candy Student",
  notes: "",
  phone: "44888888888",
  studentPhone: "",
  studentPhoneAlt: "",
};

describe("ProfileScreen", () => {
  it("loads and saves the shared student profile", async () => {
    const updated = { ...profile, name: "Candy Student Updated" };
    const client = {
      getStudentAvatarSource: jest.fn(),
      getStudentProfile: jest.fn(async () => profile),
      updateStudentProfile: jest.fn(async () => ({
        message: "Perfil atualizado com sucesso.",
        ok: true as const,
        profile: updated,
      })),
      uploadStudentAvatar: jest.fn(),
    };
    const refreshUser = jest.fn(async () => undefined);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = await render(
      <QueryClientProvider client={queryClient}>
        <ProfileScreen
          client={client}
          onBack={jest.fn()}
          refreshUser={refreshUser}
        />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(view.getByLabelText("Nome completo").props.value).toBe(
        "Candy Student",
      );
    });

    await fireEvent.changeText(
      view.getByLabelText("Nome completo"),
      "Candy Student Updated",
    );
    await fireEvent.press(view.getByText("Salvar perfil"));

    await waitFor(() => {
      expect(client.updateStudentProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Candy Student Updated" }),
      );
      expect(refreshUser).toHaveBeenCalledTimes(1);
      expect(
        view.getByText("Perfil atualizado com sucesso."),
      ).toBeTruthy();
    });

    await view.unmount();
    queryClient.clear();
  });
});

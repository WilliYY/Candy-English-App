import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Alert } from "react-native";

import { AdminUserEditorScreen } from "@/features/admin-users/admin-user-editor-screen";
import { AdminUserDetailScreen } from "@/features/admin-users/admin-user-detail-screen";
import { AdminUserPasswordScreen } from "@/features/admin-users/admin-user-password-screen";
import { AdminUsersScreen } from "@/features/admin-users/admin-users-screen";
import type {
  MobileAdminUserDetail,
  MobileAdminUserList,
} from "@/lib/api/mobile-api-client";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

const users: MobileAdminUserList = {
  generatedAt: "2026-08-01T12:00:00.000Z",
  items: [
    {
      createdAt: "2026-07-01T12:00:00.000Z",
      email: "student@candy.example",
      id: "user-1",
      isActive: true,
      name: "Student Candy",
      profileComplete: true,
      role: "STUDENT",
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
  ],
  nextCursor: null,
  total: 1,
};

describe("Admin user screens", () => {
  it("lists, filters and opens users without credential data", async () => {
    const getAdminUsers = jest.fn(async () => users);
    const onCreateUser = jest.fn();
    const onOpenUser = jest.fn();
    const view = await render(
      <AdminUsersScreen
        client={{ getAdminUsers }}
        onBack={jest.fn()}
        onCreateUser={onCreateUser}
        onOpenUser={onOpenUser}
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Student Candy")).toBeTruthy();
    expect(view.getByText("student@candy.example")).toBeTruthy();
    expect(view.queryByText(/senha/i)).toBeNull();
    await fireEvent.press(view.getByLabelText("Cadastrar novo usuario"));
    expect(onCreateUser).toHaveBeenCalledTimes(1);

    await fireEvent.changeText(
      view.getByLabelText("Buscar usuarios por nome ou email"),
      "Ana Candy",
    );
    await fireEvent.press(view.getByLabelText("Aplicar busca de usuarios"));
    await waitFor(() => {
      expect(getAdminUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({
          limit: 25,
          query: "Ana Candy",
          status: "ALL",
        }),
      );
    });

    await fireEvent.press(
      await view.findByLabelText("Abrir usuario Student Candy"),
    );
    expect(onOpenUser).toHaveBeenCalledWith("user-1");
  });

  it("shows safe contact and student profile details", async () => {
    const detail: MobileAdminUserDetail = {
      address: "Rua Candy, 10",
      createdAt: "2026-07-01T12:00:00.000Z",
      email: "student@candy.example",
      id: "user-1",
      isActive: true,
      name: "Student Candy",
      phone: "11999999999",
      role: "STUDENT",
      studentProfile: {
        contractsCount: 1,
        id: "student-1",
        lessonsCount: 2,
        level: "B1",
        submissionsCount: 3,
        teacherNames: ["Teacher Candy"],
      },
      teacherProfile: null,
      updatedAt: "2026-08-01T12:00:00.000Z",
    };
    const changeAdminUserStatus = jest.fn(async () => ({
      changed: true,
      isActive: false,
      message: "Usuario desativado com sucesso.",
      ok: true as const,
      userId: "user-1",
    }));
    const onResetPassword = jest.fn();
    const alert = jest.spyOn(Alert, "alert").mockImplementation(
      (_title, _message, buttons) => {
        buttons?.find((button) => button.text === "Desativar")?.onPress?.();
      },
    );
    const view = await render(
      <AdminUserDetailScreen
        client={{
          changeAdminUserStatus,
          getAdminUser: jest.fn(async () => detail),
        }}
        onBack={jest.fn()}
        onEditUser={jest.fn()}
        onResetPassword={onResetPassword}
        userId="user-1"
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Student Candy")).toBeTruthy();
    expect(view.getByText("Teacher Candy")).toBeTruthy();
    expect(view.getByText("B1")).toBeTruthy();
    expect(view.queryByText(/passwordHash/i)).toBeNull();
    await fireEvent.press(view.getByLabelText("Redefinir senha do usuario"));
    expect(onResetPassword).toHaveBeenCalledWith("user-1");
    await fireEvent.press(view.getByLabelText("Desativar usuario"));
    await waitFor(() => {
      expect(changeAdminUserStatus).toHaveBeenCalledWith("user-1", {
        confirmStatusChange: true,
        expectedUpdatedAt: detail.updatedAt,
        isActive: false,
      });
    });
    alert.mockRestore();
  });

  it("creates a user only after validating matching passwords", async () => {
    const createAdminUser = jest.fn(async () => ({
      message: "Usuario cadastrado com sucesso.",
      ok: true as const,
      userId: "user-2",
    }));
    const onSaved = jest.fn();
    const view = await render(
      <AdminUserEditorScreen
        client={{ createAdminUser, getAdminUser: jest.fn() }}
        onBack={jest.fn()}
        onSaved={onSaved}
      />,
      { wrapper: createWrapper() },
    );

    await fireEvent.changeText(view.getByLabelText("Nome do usuario"), "Ana Candy");
    await fireEvent.changeText(view.getByLabelText("Email do usuario"), "ana@example.com");
    await fireEvent.changeText(view.getByLabelText("Senha temporaria"), "StrongPass123");
    await fireEvent.changeText(view.getByLabelText("Confirmar senha temporaria"), "StrongPass123");
    await fireEvent.press(view.getByLabelText("Salvar novo usuario"));

    await waitFor(() => {
      expect(createAdminUser).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmPassword: "StrongPass123",
          email: "ana@example.com",
          name: "Ana Candy",
          password: "StrongPass123",
          role: "STUDENT",
        }),
      );
      expect(onSaved).toHaveBeenCalledWith("user-2");
    });
  });

  it("confirms password reset and sends matching passwords without persisting them", async () => {
    const detail: MobileAdminUserDetail = {
      address: null,
      createdAt: "2026-07-01T12:00:00.000Z",
      email: "student@candy.example",
      id: "user-1",
      isActive: true,
      name: "Student Candy",
      phone: null,
      role: "STUDENT",
      studentProfile: null,
      teacherProfile: null,
      updatedAt: "2026-08-01T12:00:00.000Z",
    };
    const resetAdminUserPassword = jest.fn(async () => ({
      message: "Senha redefinida e sessoes encerradas com sucesso.",
      ok: true as const,
      userId: "user-1",
    }));
    const onSaved = jest.fn();
    const alert = jest.spyOn(Alert, "alert").mockImplementation(
      (_title, _message, buttons) => {
        buttons?.find((button) => button.text === "Redefinir")?.onPress?.();
      },
    );
    const view = await render(
      <AdminUserPasswordScreen
        client={{
          getAdminUser: jest.fn(async () => detail),
          resetAdminUserPassword,
        }}
        onBack={jest.fn()}
        onSaved={onSaved}
        userId="user-1"
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Student Candy")).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText("Nova senha"),
      "NewStrongPass123",
    );
    await fireEvent.changeText(
      view.getByLabelText("Confirmar nova senha"),
      "NewStrongPass123",
    );
    await fireEvent.press(view.getByLabelText("Redefinir senha"));

    await waitFor(() => {
      expect(resetAdminUserPassword).toHaveBeenCalledWith("user-1", {
        confirmNewPassword: "NewStrongPass123",
        confirmPasswordReset: true,
        expectedUpdatedAt: detail.updatedAt,
        newPassword: "NewStrongPass123",
      });
      expect(onSaved).toHaveBeenCalledWith("user-1");
    });
    expect(view.queryByDisplayValue("NewStrongPass123")).toBeNull();
    alert.mockRestore();
  });
});

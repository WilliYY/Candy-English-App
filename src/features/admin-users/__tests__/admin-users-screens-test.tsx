import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { AdminUserDetailScreen } from "@/features/admin-users/admin-user-detail-screen";
import { AdminUsersScreen } from "@/features/admin-users/admin-users-screen";
import type {
  MobileAdminUserDetail,
  MobileAdminUserList,
} from "@/lib/api/mobile-api-client";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
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
    const onOpenUser = jest.fn();
    const view = await render(
      <AdminUsersScreen
        client={{ getAdminUsers }}
        onBack={jest.fn()}
        onOpenUser={onOpenUser}
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Student Candy")).toBeTruthy();
    expect(view.getByText("student@candy.example")).toBeTruthy();
    expect(view.queryByText(/senha/i)).toBeNull();

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
      view.getByLabelText("Abrir usuario Student Candy"),
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
    const view = await render(
      <AdminUserDetailScreen
        client={{ getAdminUser: jest.fn(async () => detail) }}
        onBack={jest.fn()}
        userId="user-1"
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Student Candy")).toBeTruthy();
    expect(view.getByText("Teacher Candy")).toBeTruthy();
    expect(view.getByText("B1")).toBeTruthy();
    expect(view.queryByText(/passwordHash/i)).toBeNull();
  });
});

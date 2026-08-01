import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { AdminPreRegistrationDetailScreen } from "@/features/admin-pre-registrations/admin-pre-registration-detail-screen";
import { AdminPreRegistrationsScreen } from "@/features/admin-pre-registrations/admin-pre-registrations-screen";
import type {
  MobileAdminPreRegistration,
  MobileAdminPreRegistrationList,
  MobileAdminPreRegistrationListItem,
} from "@/lib/api/admin-pre-registrations-contracts";

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

const listItem: MobileAdminPreRegistrationListItem = {
  assignedTeacherName: "Teacher Candy",
  converted: false,
  createdAt: "2026-08-01T10:00:00.000Z",
  email: "ana@example.com",
  fullName: "Ana Candy",
  id: "pre-1",
  phone: "44999999999",
  status: "READY_TO_CONVERT",
  statusNote: "Documentos conferidos",
  unit: "IVATE",
  updatedAt: "2026-08-01T12:00:00.000Z",
};

const list: MobileAdminPreRegistrationList = {
  generatedAt: "2026-08-01T13:00:00.000Z",
  items: [listItem],
  nextCursor: null,
  total: 1,
};

const detail: MobileAdminPreRegistration = {
  ...listItem,
  address: "Rua Candy, 10",
  agenda: { complete: true, days: ["Seg", "Qua"], time: "19:00" },
  birthDate: "2010-05-20",
  canConvert: true,
  city: "Ivaté",
  converted: false,
  convertedUser: null,
  createdBy: { name: "Admin Candy", role: "ADMIN" },
  englishGoal: "Conversacao",
  estimatedLevel: "A2",
  finance: { complete: true },
  guardianDocument: "12345678900",
  guardianName: "Maria Candy",
  guardianPhone: "44977777777",
  installmentsTotal: 12,
  notes: "Prefere aulas online",
  paymentDay: 10,
  paymentMethod: "PIX",
  reviewedAt: null,
  reviewedByName: null,
  secondaryContact: null,
  studentPhone: "44988888888",
  tuitionCents: 35000,
};

describe("Admin pre-registration screens", () => {
  it("lists, searches and opens administrative pre-registrations", async () => {
    const getAdminPreRegistrations = jest.fn(async () => list);
    const onOpenPreRegistration = jest.fn();
    const view = await render(
      <AdminPreRegistrationsScreen
        client={{ getAdminPreRegistrations }}
        onBack={jest.fn()}
        onOpenPreRegistration={onOpenPreRegistration}
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Ana Candy")).toBeTruthy();
    expect(view.getByText("Teacher Candy")).toBeTruthy();
    expect(view.getByText("Pronto para converter")).toBeTruthy();
    await fireEvent.press(
      view.getByLabelText("Abrir pre-cadastro de Ana Candy"),
    );
    expect(onOpenPreRegistration).toHaveBeenCalledWith("pre-1");

    await fireEvent.changeText(
      view.getByLabelText("Buscar pre-cadastros"),
      "Ana",
    );
    await fireEvent.press(view.getByLabelText("Pesquisar pre-cadastros"));
    await waitFor(() => {
      expect(getAdminPreRegistrations).toHaveBeenCalledWith(
        expect.objectContaining({ query: "Ana", status: "OPEN", unit: "ALL" }),
      );
    });
  });

  it("shows complete administrative detail and readiness", async () => {
    const view = await render(
      <AdminPreRegistrationDetailScreen
        client={{ getAdminPreRegistration: jest.fn(async () => detail) }}
        onBack={jest.fn()}
        requestId="pre-1"
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Ana Candy")).toBeTruthy();
    expect(view.getByText("Maria Candy")).toBeTruthy();
    expect(view.getByText("12345678900")).toBeTruthy();
    expect(view.getByText("Seg, Qua · 19:00")).toBeTruthy();
    expect(view.getByText("R$ 350,00")).toBeTruthy();
    expect(view.getByText("Pronto para conversao")).toBeTruthy();
    expect(view.queryByText(/convertedUserId/i)).toBeNull();
  });
});

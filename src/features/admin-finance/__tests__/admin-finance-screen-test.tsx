import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { AdminFinanceScreen } from "@/features/admin-finance/admin-finance-screen";
import type { MobileAdminFinance } from "@/lib/api/admin-finance-contracts";

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

const summary = {
  incompleteCount: 0,
  overdueCents: 35_000,
  overdueCount: 1,
  paidCents: 0,
  paidCount: 0,
  pendingCents: 35_000,
  pendingCount: 1,
  studentsCount: 1,
  totalCents: 35_000,
};

const finance: MobileAdminFinance = {
  generatedAt: "2026-08-15T15:00:00.000Z",
  items: [
    {
      amountCents: 35_000,
      id: "payment-1",
      installmentNumber: 1,
      installmentsTotal: 12,
      isPaid: false,
      month: 8,
      name: "Ana Candy",
      note: "Lembrar responsavel",
      paidAt: null,
      paymentDay: 10,
      paymentMethod: "PIX",
      status: "OVERDUE",
      studentId: "student-1",
      unit: "IVATE",
      updatedAt: "2026-08-11T12:00:00.000Z",
      year: 2026,
    },
  ],
  nextCursor: null,
  period: { month: 8, year: 2026 },
  scopeSummary: summary,
  total: 1,
  unitSummaries: [
    { ...summary, unit: "IVATE" },
    {
      ...summary,
      overdueCents: 0,
      overdueCount: 0,
      pendingCents: 0,
      pendingCount: 0,
      studentsCount: 0,
      totalCents: 0,
      unit: "DOURADINA",
    },
  ],
};

describe("AdminFinanceScreen", () => {
  it("shows safe unit totals and applies period, unit, status and search filters", async () => {
    const getAdminFinance = jest.fn(async () => finance);
    const onOpenActivity = jest.fn();
    const onOpenPayment = jest.fn();
    const view = await render(
      <AdminFinanceScreen
        client={{ getAdminFinance }}
        initialPeriod={{ month: 8, year: 2026 }}
        onBack={jest.fn()}
        onOpenActivity={onOpenActivity}
        onOpenPayment={onOpenPayment}
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Ana Candy")).toBeTruthy();
    expect(view.getAllByText("Atrasado").length).toBeGreaterThan(0);
    expect(view.getAllByText(/350,00/).length).toBeGreaterThan(0);
    expect(view.getByText("1/12")).toBeTruthy();
    await fireEvent.press(view.getByLabelText("Abrir gastos e historico"));
    await fireEvent.press(view.getByLabelText("Abrir pagamento de Ana Candy"));
    expect(onOpenActivity).toHaveBeenCalledTimes(1);
    expect(onOpenPayment).toHaveBeenCalledWith("payment-1");
    expect(getAdminFinance).toHaveBeenCalledWith({
      cursor: undefined,
      limit: 25,
      month: 8,
      query: undefined,
      status: "ALL",
      unit: "ALL",
      year: 2026,
    });

    await fireEvent.press(view.getByLabelText("Filtrar unidade Douradina"));
    await fireEvent.press(view.getByLabelText("Filtrar status Recebidos"));
    await fireEvent.changeText(
      view.getByLabelText("Buscar aluno no financeiro"),
      "Bruna",
    );
    await fireEvent.press(view.getByLabelText("Pesquisar financeiro"));

    await waitFor(() => {
      expect(getAdminFinance).toHaveBeenCalledWith(
        expect.objectContaining({
          month: 8,
          query: "Bruna",
          status: "PAID",
          unit: "DOURADINA",
          year: 2026,
        }),
      );
    });
    view.unmount();
  });
});

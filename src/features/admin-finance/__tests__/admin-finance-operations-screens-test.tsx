import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Alert } from "react-native";

import { AdminFinanceActivityScreen } from "@/features/admin-finance/admin-finance-activity-screen";
import { AdminFinancePaymentScreen } from "@/features/admin-finance/admin-finance-payment-screen";
import type {
  MobileAdminFinanceActivity,
  MobileAdminFinanceItem,
} from "@/lib/api/admin-finance-contracts";

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "11111111-1111-4111-8111-111111111111"),
}));

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

const payment: MobileAdminFinanceItem = {
  amountCents: 35_000,
  id: "payment-1",
  installmentNumber: 1,
  installmentsTotal: 12,
  isPaid: false,
  month: 8,
  name: "Ana Candy",
  note: null,
  paidAt: null,
  paymentDay: 10,
  paymentMethod: "PIX",
  status: "OVERDUE",
  studentId: "student-1",
  unit: "IVATE",
  updatedAt: "2026-08-11T12:00:00.000Z",
  year: 2026,
};

const activity: MobileAdminFinanceActivity = {
  expenseSummary: { count: 1, totalCents: 12_500 },
  expenses: [
    {
      actorName: "Administracao",
      amountCents: 12_500,
      createdAt: "2026-08-15T15:00:00.000Z",
      id: "expense-1",
      itemName: "Material didatico",
      note: null,
      purchasedAt: "2026-08-15",
      unit: "IVATE",
      updatedAt: "2026-08-15T15:00:00.000Z",
    },
  ],
  generatedAt: "2026-08-15T15:00:00.000Z",
  logs: [
    {
      action: "MOBILE_EXPENSE",
      createdAt: "2026-08-15T15:00:00.000Z",
      description: "Gasto registrado no app.",
      id: "log-1",
      studentName: null,
    },
  ],
  logsScope: "GLOBAL_RECENT",
  period: { month: 8, year: 2026 },
  unit: "ALL",
};

describe("Admin finance operation screens", () => {
  afterEach(() => jest.restoreAllMocks());

  it("updates a payment only after explicit confirmation with version and operation id", async () => {
    const getAdminFinancePayment = jest.fn(async () => payment);
    const updateAdminFinancePayment = jest.fn(async (_id, input) => ({
      message: "Pagamento marcado como pago.",
      ok: true as const,
      payment: { ...payment, isPaid: true, status: "PAID" as const },
      replayed: false,
    }));
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === "Confirmar")?.onPress?.();
    });
    const view = await render(
      <AdminFinancePaymentScreen
        client={{ getAdminFinancePayment, updateAdminFinancePayment }}
        onBack={jest.fn()}
        paymentId="payment-1"
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Ana Candy")).toBeTruthy();
    await fireEvent.changeText(view.getByLabelText("Observacao do pagamento"), "Pago no PIX");
    await fireEvent.press(view.getByLabelText("Marcar pagamento como recebido"));

    await waitFor(() => {
      expect(updateAdminFinancePayment).toHaveBeenCalledWith("payment-1", {
        amountCents: 35_000,
        confirmChange: true,
        expectedUpdatedAt: payment.updatedAt,
        isPaid: true,
        note: "Pago no PIX",
        operationId: "11111111-1111-4111-8111-111111111111",
      });
    });
  });

  it("creates an expense only after explicit confirmation and shows safe global logs", async () => {
    const getAdminFinanceActivity = jest.fn(async () => activity);
    const createAdminFinanceExpense = jest.fn(async () => ({
      expense: activity.expenses[0]!,
      message: "Gasto registrado com sucesso.",
      ok: true as const,
      replayed: false,
    }));
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === "Confirmar")?.onPress?.();
    });
    const view = await render(
      <AdminFinanceActivityScreen
        client={{ createAdminFinanceExpense, getAdminFinanceActivity }}
        initialPeriod={{ month: 8, year: 2026 }}
        onBack={jest.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Material didatico")).toBeTruthy();
    expect(view.getByText("Historico global recente")).toBeTruthy();
    expect(view.getByText("Gasto registrado no app.")).toBeTruthy();
    await fireEvent.changeText(view.getByLabelText("Nome do gasto"), "Internet");
    await fireEvent.changeText(view.getByLabelText("Quem pagou"), "Williany");
    await fireEvent.changeText(view.getByLabelText("Valor do gasto"), "129,90");
    await fireEvent.changeText(view.getByLabelText("Data da compra"), "2026-08-20");
    await fireEvent.press(view.getByLabelText("Registrar gasto"));

    await waitFor(() => {
      expect(createAdminFinanceExpense).toHaveBeenCalledWith({
        actorName: "Williany",
        amountCents: 12_990,
        confirmCreate: true,
        itemName: "Internet",
        month: 8,
        note: null,
        operationId: "11111111-1111-4111-8111-111111111111",
        purchasedAt: "2026-08-20",
        unit: "IVATE",
        year: 2026,
      });
    });
  });
});

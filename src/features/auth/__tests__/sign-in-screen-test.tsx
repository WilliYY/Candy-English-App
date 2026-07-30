import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { SignInScreen } from "@/features/auth/sign-in-screen";

describe("SignInScreen", () => {
  it("submits normalized credentials through accessible fields", async () => {
    const onSubmit = jest.fn(async () => undefined);
    const view = await render(<SignInScreen onSubmit={onSubmit} />);

    await fireEvent.changeText(
      view.getByLabelText("Email"),
      "  Teacher@Candy.Example  ",
    );
    await fireEvent.changeText(
      view.getByLabelText("Senha"),
      "correct-password",
    );
    await fireEvent.press(view.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "teacher@candy.example",
        password: "correct-password",
      });
    });

    await view.unmount();
  });

  it("keeps invalid credentials on screen with a useful message", async () => {
    const view = await render(
      <SignInScreen onSubmit={jest.fn(async () => undefined)} />,
    );

    await fireEvent.changeText(
      view.getByLabelText("Email"),
      "not-an-email",
    );
    await fireEvent.changeText(view.getByLabelText("Senha"), "short");
    await fireEvent.press(view.getByRole("button", { name: "Entrar" }));

    expect(await view.findByText("Informe um email válido.")).toBeTruthy();
    expect(
      await view.findByText("A senha precisa ter pelo menos 8 caracteres."),
    ).toBeTruthy();

    await view.unmount();
  });
});

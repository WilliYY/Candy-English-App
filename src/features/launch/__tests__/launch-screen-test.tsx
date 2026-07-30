import { fireEvent, render } from "@testing-library/react-native";

import { LaunchScreen } from "@/features/launch/launch-screen";

describe("LaunchScreen", () => {
  it("introduces the shared Candy English app for every role", async () => {
    const view = await render(<LaunchScreen onSignIn={jest.fn()} />);

    expect(view.getByText("Um só Candy English")).toBeTruthy();
    expect(view.getByText("Aluno")).toBeTruthy();
    expect(view.getByText("Professora")).toBeTruthy();
    expect(view.getByText("Administração")).toBeTruthy();
  });

  it("starts the sign-in flow from an accessible primary action", async () => {
    const onSignIn = jest.fn();
    const view = await render(<LaunchScreen onSignIn={onSignIn} />);

    fireEvent.press(
      view.getByRole("button", { name: "Entrar no Candy English" }),
    );

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./pages/auth/Login";
import SequenceEditor from "./components/SequenceEditor";
import { AuthProvider } from "./auth/AuthContext";
import AppShell from "./layouts/AppShell";
import CreateClassPage from "./pages/instructor/CreateClass";

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("login form", () => {
  it("requires email and password", async () => {
    renderLogin();
    const email = screen.getByLabelText(/email/i);
    const password = screen.getByLabelText(/password/i);
    await userEvent.clear(email);
    await userEvent.clear(password);
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(email).toBeRequired();
    expect(password).toBeRequired();
  });
});

describe("sequence editor", () => {
  it("adds and removes items", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const items = [{ name: "Centering", itemType: "pose", durationSeconds: 60 }];
    const { rerender } = render(
      <SequenceEditor items={items} poses={[]} onChange={onChange} />
    );
    await user.click(screen.getByRole("button", { name: /add pose/i }));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0][0];
    expect(next).toHaveLength(2);
    rerender(<SequenceEditor items={next} poses={[]} onChange={onChange} />);
    await user.click(screen.getAllByText("Remove")[0]);
    expect(onChange.mock.calls.at(-1)[0]).toHaveLength(1);
  });
});

describe("role-based navigation", () => {
  it("shows instructor links for instructor users", () => {
    localStorage.setItem(
      "yoga_user",
      JSON.stringify({ id: 1, fullName: "Asha", roles: ["instructor"] })
    );
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getAllByText("Create class").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Daily Yoga")).toHaveLength(0);
  });

  it("shows student links for student users", () => {
    localStorage.setItem(
      "yoga_user",
      JSON.stringify({ id: 2, fullName: "Maya", roles: ["student"] })
    );
    render(
      <MemoryRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getAllByText("Daily Yoga").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Create class")).toHaveLength(0);
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
  });
});

describe("create class validation", () => {
  it("renders required class information fields", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CreateClassPage />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/class information/i)).toBeInTheDocument();
    expect(screen.getByText(/duration/i)).toBeInTheDocument();
    expect(screen.getByText(/yoga style/i)).toBeInTheDocument();
  });
});

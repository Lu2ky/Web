import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import LogInForm from "./LogInForm";
import LDAPservice from "./services/LDAPservice";
import * as authSession from "./services/authSession";

vi.mock("./services/LDAPservice", () => ({
  default: vi.fn(),
}));

vi.mock("./services/authSession", () => ({
  createAuthSession: vi.fn(),
  ROLE_ADMIN_UPB_PLANNER: "admin_upb_planner",
  ROLE_USUARIOS: "Usuarios",
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderLogInForm = () => {
  return render(
    <BrowserRouter>
      <LogInForm />
    </BrowserRouter>
  );
};

const fillAndSubmit = async ({ userId, password, acceptTerms = true }) => {
  if (userId !== undefined) {
    await userEvent.type(screen.getByPlaceholderText("Id Usuario"), userId);
  }

  if (password !== undefined) {
    await userEvent.type(screen.getByPlaceholderText("Contraseña"), password);
  }

  if (acceptTerms) {
    await userEvent.click(screen.getByRole("checkbox"));
  }

  await userEvent.click(screen.getByRole("button", { name: /Iniciar Sesión/i }));
};

describe("LogInForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra formulario y contraseña enmascarada por defecto", () => {
    renderLogInForm();

    expect(screen.getByRole("heading", { level: 1, name: /Iniciar Sesión/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Id Usuario")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Contraseña")).toHaveAttribute("type", "password");
  });

  it("valida credenciales contra LDAP service", async () => {
    LDAPservice.mockResolvedValue({
      success: false,
      message: "Usuario o contraseña incorrectos",
    });

    renderLogInForm();
    await fillAndSubmit({ userId: "usuario-demo", password: "pass-demo" });

    await waitFor(() => {
      expect(LDAPservice).toHaveBeenCalledWith("usuario-demo", "pass-demo");
    });
  });

  it("redirige al panel principal de usuario cuando autenticación es correcta", async () => {
    LDAPservice.mockResolvedValue({
      success: true,
      token: "token-user",
      roles: ["Usuarios"],
    });

    renderLogInForm();
    await fillAndSubmit({ userId: "usertest", password: "userpass" });

    await waitFor(() => {
      expect(authSession.createAuthSession).toHaveBeenCalledWith({
        userId: "usertest",
        token: "token-user",
        roles: ["Usuarios"],
      });
      expect(mockNavigate).toHaveBeenCalledWith("/app/usertest");
    });
  });

  it("redirige a panel admin cuando rol admin es válido", async () => {
    LDAPservice.mockResolvedValue({
      success: true,
      token: "token-admin",
      roles: ["admin_upb_planner"],
    });

    renderLogInForm();
    await fillAndSubmit({ userId: "admin", password: "adminpass" });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/AdminView");
    });
  });

  it("muestra mensaje informativo cuando credenciales son incorrectas", async () => {
    LDAPservice.mockResolvedValue({
      success: false,
      message: "Usuario o contraseña incorrectos",
    });

    renderLogInForm();
    await fillAndSubmit({ userId: "wronguser", password: "wrongpass" });

    expect(await screen.findByText(/Usuario o contraseña incorrectos/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("muestra modal de credenciales incorrectas cuando LDAP no responde", async () => {
    LDAPservice.mockResolvedValue(null);

    renderLogInForm();
    await fillAndSubmit({ userId: "user", password: "pass" });

    expect(await screen.findByText(/Credenciales incorrectas/i)).toBeInTheDocument();
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserProfile from "./UserProfile";
import * as userService from "../../services/userService";
import LDAPservice from "../../services/LDAPservice";

vi.mock("../../services/userService", () => ({
    getUserData: vi.fn(),
    changePassword: vi.fn(),
}));

vi.mock("../../services/LDAPservice", () => ({
    default: vi.fn(),
}));

describe("UserProfile - cambio de contrasena", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        userService.getUserData.mockResolvedValue({
            nombre: "Usuario Prueba",
            semestreActual: "7",
            programa: "Ingenieria",
        });
        LDAPservice.mockResolvedValue({ success: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    async function completarFormularioContrasena(user, values) {
        await user.type(screen.getByLabelText(/Contrase.a Actual/i), values.current);
        await user.type(screen.getByLabelText(/^Nueva Contrase.a$/i), values.newPassword);
        await user.type(screen.getByLabelText(/^Confirmar Nueva Contrase.a$/i), values.confirm);
        await user.click(screen.getByRole("button", { name: /Cambiar Contrase.a/i }));
    }

    it("envia cambio cuando los datos son validos", async () => {
        userService.changePassword.mockResolvedValue({ success: true });

        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await completarFormularioContrasena(user, {
            current: "Actual123",
            newPassword: "Nueva#123",
            confirm: "Nueva#123",
        });

        await waitFor(() => {
            expect(userService.changePassword).toHaveBeenCalledWith(123, "Actual123", "Nueva#123");
        });

        expect(await screen.findByText(/Contrase.a cambiada exitosamente/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contrase.a Actual/i)).toHaveValue("");
        expect(screen.getByLabelText(/^Nueva Contrase.a$/i)).toHaveValue("");
        expect(screen.getByLabelText(/^Confirmar Nueva Contrase.a$/i)).toHaveValue("");
    });

    it("muestra validacion y no llama al servicio cuando no coinciden", async () => {
        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await completarFormularioContrasena(user, {
            current: "Actual123",
            newPassword: "Nueva#123",
            confirm: "Distinta#123",
        });

        expect(userService.changePassword).not.toHaveBeenCalled();
        expect(screen.getAllByText(/Las contrase.as no coinciden/i).length).toBeGreaterThan(0);
    });

    it("muestra validacion por longitud minima y no llama al servicio", async () => {
        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await completarFormularioContrasena(user, {
            current: "Actual123",
            newPassword: "12345",
            confirm: "12345",
        });

        expect(userService.changePassword).not.toHaveBeenCalled();
        expect(screen.getByText(/La contrase.a debe tener al menos 8 caracteres/i)).toBeInTheDocument();
    });

    it("actualiza checklist en tiempo real segun criterios cumplidos", async () => {
        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        expect(screen.getByText("Criterios de seguridad")).toBeInTheDocument();
        expect(screen.getByText(/0\s*\/\s*6/)).toBeInTheDocument();

        await user.type(screen.getByLabelText(/^Nueva Contrase.a$/i), "Nueva#123");
        expect(screen.getByText(/5\s*\/\s*6/)).toBeInTheDocument();

        await user.type(screen.getByLabelText(/Contrase.a Actual/i), "Actual#123");
        expect(screen.getByText(/6\s*\/\s*6/)).toBeInTheDocument();

        await user.clear(screen.getByLabelText(/Contrase.a Actual/i));
        await user.type(screen.getByLabelText(/Contrase.a Actual/i), "Nueva#123");

        expect(screen.getByText(/5\s*\/\s*6/)).toBeInTheDocument();

        await user.clear(screen.getByLabelText(/Contrase.a Actual/i));
        await user.type(screen.getByLabelText(/Contrase.a Actual/i), "Vieja#123");

        expect(screen.getByText(/6\s*\/\s*6/)).toBeInTheDocument();
        expect(screen.getByText(/Debe ser diferente a la contrase.a actual/i)).toBeInTheDocument();
    });

    it("muestra validacion cuando la nueva contrasena es igual a la actual", async () => {
        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await completarFormularioContrasena(user, {
            current: "Misma#123",
            newPassword: "Misma#123",
            confirm: "Misma#123",
        });

        expect(userService.changePassword).not.toHaveBeenCalled();
        expect(screen.getByText(/La nueva contrase.a debe ser diferente a la actual/i)).toBeInTheDocument();
    });

    it("muestra error cuando el servicio falla", async () => {
        userService.changePassword.mockResolvedValue(null);

        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await completarFormularioContrasena(user, {
            current: "Actual123",
            newPassword: "Nueva#123",
            confirm: "Nueva#123",
        });

        await waitFor(() => {
            expect(userService.changePassword).toHaveBeenCalledTimes(1);
        });

        expect(await screen.findByText(/Error al cambiar la contrase.a/i)).toBeInTheDocument();
    });

    it("valida con LDAP y bloquea cambio si la contrasena actual es incorrecta", async () => {
        LDAPservice.mockResolvedValue({ success: false, message: "Usuario o contraseña incorrectos" });

        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await completarFormularioContrasena(user, {
            current: "Incorrecta#123",
            newPassword: "Nueva#123",
            confirm: "Nueva#123",
        });

        expect(LDAPservice).toHaveBeenCalledWith("123", "Incorrecta#123");
        expect(userService.changePassword).not.toHaveBeenCalled();
        expect(await screen.findByText(/Usuario o contrase.a incorrectos/i)).toBeInTheDocument();
    });

    it("muestra validacion cuando falta la contrasena actual", async () => {
        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await user.type(screen.getByLabelText(/^Nueva Contrase.a$/i), "Nueva#123");
        await user.type(screen.getByLabelText(/^Confirmar Nueva Contrase.a$/i), "Nueva#123");
        await user.click(screen.getByRole("button", { name: /Cambiar Contrase.a/i }));

        expect(userService.changePassword).not.toHaveBeenCalled();
        expect(screen.getByText(/Por favor ingresa tu contrase.a actual/i)).toBeInTheDocument();
    });

    it("muestra validacion cuando falta la nueva contrasena", async () => {
        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await user.type(screen.getByLabelText(/Contrase.a Actual/i), "Actual#123");
        await user.type(screen.getByLabelText(/^Confirmar Nueva Contrase.a$/i), "Nueva#123");
        await user.click(screen.getByRole("button", { name: /Cambiar Contrase.a/i }));

        expect(userService.changePassword).not.toHaveBeenCalled();
        expect(screen.getByText(/Por favor ingresa una nueva contrase.a/i)).toBeInTheDocument();
    });

    it("muestra validacion cuando falta confirmar la nueva contrasena", async () => {
        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await user.type(screen.getByLabelText(/Contrase.a Actual/i), "Actual#123");
        await user.type(screen.getByLabelText(/^Nueva Contrase.a$/i), "Nueva#123");
        await user.click(screen.getByRole("button", { name: /Cambiar Contrase.a/i }));

        expect(userService.changePassword).not.toHaveBeenCalled();
        expect(screen.getByText(/Por favor confirma la nueva contrase.a/i)).toBeInTheDocument();
    });

    it("deshabilita formulario mientras se procesa el cambio", async () => {
        let resolveRequest;
        userService.changePassword.mockImplementation(
            () => new Promise((resolve) => {
                resolveRequest = resolve;
            })
        );

        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await completarFormularioContrasena(user, {
            current: "Actual#123",
            newPassword: "Nueva#123",
            confirm: "Nueva#123",
        });

        const submitButton = screen.getByRole("button", { name: /Cambiar contrase.a/i });
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent(/Actualizando/i);
        expect(screen.getByLabelText(/Contrase.a Actual/i)).toBeDisabled();
        expect(screen.getByLabelText(/^Nueva Contrase.a$/i)).toBeDisabled();
        expect(screen.getByLabelText(/^Confirmar Nueva Contrase.a$/i)).toBeDisabled();

        resolveRequest({ success: true });

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Cambiar Contrase.a/i })).toBeEnabled();
        });
    });

    it("programa limpieza del mensaje de exito a los 3 segundos", async () => {
        const timeoutSpy = vi.spyOn(globalThis, "setTimeout");
        userService.changePassword.mockResolvedValue({ success: true });

        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await completarFormularioContrasena(user, {
            current: "Actual#123",
            newPassword: "Nueva#123",
            confirm: "Nueva#123",
        });

        expect(await screen.findByText(/Contrase.a cambiada exitosamente/i)).toBeInTheDocument();
        expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
    });
});

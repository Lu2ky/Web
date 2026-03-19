import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserProfile from "./UserProfile";
import * as userService from "../../services/userService";

vi.mock("../../services/userService", () => ({
    getUserData: vi.fn(),
    changePassword: vi.fn(),
}));

describe("UserProfile - cambio de contrasena", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        userService.getUserData.mockResolvedValue({
            nombre: "Usuario Prueba",
            semestreActual: "7",
            programa: "Ingenieria",
        });
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
            newPassword: "Nueva123",
            confirm: "Nueva123",
        });

        await waitFor(() => {
            expect(userService.changePassword).toHaveBeenCalledWith(123, "Actual123", "Nueva123");
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
            newPassword: "Nueva123",
            confirm: "Distinta123",
        });

        expect(userService.changePassword).not.toHaveBeenCalled();
        expect(screen.getByText(/Las contrase.as no coinciden/i)).toBeInTheDocument();
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
        expect(screen.getByText(/La nueva contrase.a debe tener al menos 6 caracteres/i)).toBeInTheDocument();
    });

    it("muestra validacion cuando la nueva contrasena es igual a la actual", async () => {
        const user = userEvent.setup();
        render(<UserProfile userId={123} onClose={() => {}} />);

        await screen.findByRole("button", { name: /Cambiar Contrase.a/i });

        await completarFormularioContrasena(user, {
            current: "Misma123",
            newPassword: "Misma123",
            confirm: "Misma123",
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
            newPassword: "Nueva123",
            confirm: "Nueva123",
        });

        await waitFor(() => {
            expect(userService.changePassword).toHaveBeenCalledTimes(1);
        });

        expect(await screen.findByText(/Error al cambiar la contrase.a/i)).toBeInTheDocument();
    });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RestorePassword from "./RestorePassword";
import { changeRecoveredPassword } from "./services/passwordChangeService.jsx";

vi.mock("./services/passwordChangeService.jsx", () => ({
    changeRecoveredPassword: vi.fn(),
}));

function renderRestorePassword(locationState) {
    const state = locationState === undefined ? { userCode: "12345" } : locationState;

    return render(
        <MemoryRouter initialEntries={[{ pathname: "/RestorePassword", state }]}> 
            <Routes>
                <Route path="/" element={<div>Pantalla Login</div>} />
                <Route path="/RestorePassword" element={<RestorePassword />} />
            </Routes>
        </MemoryRouter>
    );
}

describe("RestorePassword", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("actualiza checklist en tiempo real segun criterios cumplidos", async () => {
        const user = userEvent.setup();
        renderRestorePassword();

        expect(screen.getByText("Criterios de seguridad")).toBeInTheDocument();
        expect(screen.getByText(/0\s*\/\s*6/)).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText(/^Nueva Contrase.a$/i), "Nueva#123");

        expect(screen.getByText(/6\s*\/\s*6/)).toBeInTheDocument();
        expect(screen.getByText(/Al menos 8 caracteres/i)).toBeInTheDocument();
        expect(screen.getByText(/Al menos una letra minúscula/i)).toBeInTheDocument();
        expect(screen.getByText(/Al menos una letra mayúscula/i)).toBeInTheDocument();
        expect(screen.getByText(/Al menos un número/i)).toBeInTheDocument();
        expect(screen.getByText(/Al menos un símbolo/i)).toBeInTheDocument();
        expect(screen.getByText(/Debe ser diferente a la contrase.a anterior/i)).toBeInTheDocument();
    });

    it("muestra validacion cuando las contrasenas no coinciden", async () => {
        const user = userEvent.setup();
        renderRestorePassword();

        await user.type(screen.getByPlaceholderText(/^Nueva Contrase.a$/i), "Nueva#123");
        await user.type(screen.getByPlaceholderText(/Confirmar Contrase.a/i), "Distinta#123");
        await user.click(screen.getByRole("button", { name: /Cambiar Contrase.a/i }));

        expect(changeRecoveredPassword).not.toHaveBeenCalled();
        expect(screen.getAllByText(/Las contraseñas no coinciden/i).length).toBeGreaterThan(0);
    });

    it("envia restauracion cuando los datos son validos", async () => {
        changeRecoveredPassword.mockResolvedValue({ success: true, message: "ok" });

        const user = userEvent.setup();
        renderRestorePassword();

        await user.type(screen.getByPlaceholderText(/^Nueva Contrase.a$/i), "Nueva#123");
        await user.type(screen.getByPlaceholderText(/Confirmar Contrase.a/i), "Nueva#123");
        await user.click(screen.getByRole("button", { name: /Cambiar Contrase.a/i }));

        await waitFor(() => {
            expect(changeRecoveredPassword).toHaveBeenCalledWith("12345", "Nueva#123");
        });

        expect(await screen.findByText(/Contrase.a actualizada exitosamente/i)).toBeInTheDocument();
    });

    it("muestra error si falta userCode en el estado de recuperacion", async () => {
        const user = userEvent.setup();
        renderRestorePassword(null);

        await user.type(screen.getByPlaceholderText(/^Nueva Contrase.a$/i), "Nueva#123");
        await user.type(screen.getByPlaceholderText(/Confirmar Contrase.a/i), "Nueva#123");
        await user.click(screen.getByRole("button", { name: /Cambiar Contrase.a/i }));

        expect(changeRecoveredPassword).not.toHaveBeenCalled();
        expect(screen.getByText(/No se encontro el usuario de recuperacion/i)).toBeInTheDocument();
    });

    it("marca criterio como incumplido si backend rechaza por misma contrasena anterior", async () => {
        changeRecoveredPassword.mockResolvedValue({
            success: false,
            message: "La nueva contraseña debe ser diferente a la anterior",
        });

        const user = userEvent.setup();
        renderRestorePassword();

        await user.type(screen.getByPlaceholderText(/^Nueva Contrase.a$/i), "Nueva#123");
        await user.type(screen.getByPlaceholderText(/Confirmar Contrase.a/i), "Nueva#123");
        await user.click(screen.getByRole("button", { name: /Cambiar Contrase.a/i }));

        await waitFor(() => {
            expect(changeRecoveredPassword).toHaveBeenCalledTimes(1);
        });

        expect(screen.getByText(/La nueva contrase.a debe ser diferente a la anterior/i)).toBeInTheDocument();
        expect(screen.getByText(/5\s*\/\s*6/)).toBeInTheDocument();
    });
});

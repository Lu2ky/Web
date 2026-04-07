import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DropdownAcount from "./DropdownAcount";

const mockNavigate = vi.fn();
const mockClearAuthSession = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../../services/authSession", () => ({
    clearAuthSession: () => mockClearAuthSession(),
}));

vi.mock("./UserProfile", () => ({
    default: () => <div>Mock UserProfile</div>,
}));

vi.mock("./UserPreferences", () => ({
    default: () => <div>Mock UserPreferences</div>,
}));

describe("DropdownAcount - cerrar sesion", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("abre modal de confirmacion al seleccionar Cerrar Sesion", async () => {
        const user = userEvent.setup();
        render(<DropdownAcount userId="123" />);

        await user.click(screen.getByRole("button", { name: /avatar/i }));
        await user.click(screen.getByRole("button", { name: /cerrar sesi.n/i }));

        expect(screen.getByText(/¿Est.s seguro de que deseas cerrar sesi.n\?/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /s., cerrar sesi.n/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
    });

    it("al confirmar, limpia sesion y redirige al login", async () => {
        const user = userEvent.setup();
        render(<DropdownAcount userId="123" />);

        await user.click(screen.getByRole("button", { name: /avatar/i }));
        await user.click(screen.getByRole("button", { name: /cerrar sesi.n/i }));
        await user.click(screen.getByRole("button", { name: /s., cerrar sesi.n/i }));

        expect(mockClearAuthSession).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("al cancelar, no limpia sesion ni redirige", async () => {
        const user = userEvent.setup();
        render(<DropdownAcount userId="123" />);

        await user.click(screen.getByRole("button", { name: /avatar/i }));
        await user.click(screen.getByRole("button", { name: /cerrar sesi.n/i }));
        await user.click(screen.getByRole("button", { name: /cancelar/i }));

        expect(mockClearAuthSession).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

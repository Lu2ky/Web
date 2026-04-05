import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DuplicateButton from "./DuplicateButton";

describe("DuplicateButton", () => {
    it("renderiza con titulo por defecto y tipo button", () => {
        render(<DuplicateButton />);

        const button = screen.getByRole("button", { name: "Duplicar" });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("type", "button");
    });

    it("ejecuta onClick cuando se hace click", async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(<DuplicateButton onClick={handleClick} />);
        await user.click(screen.getByRole("button", { name: "Duplicar" }));

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("acepta className y data-onboarding-id personalizados", () => {
        render(
            <DuplicateButton
                className="extra-class"
                dataOnboardingId="todo-card-duplicate-button"
                title="Duplicar tarea"
            />
        );

        const button = screen.getByRole("button", { name: "Duplicar tarea" });
        expect(button).toHaveClass("duplicate-button");
        expect(button).toHaveClass("extra-class");
        expect(button).toHaveAttribute("data-onboarding-id", "todo-card-duplicate-button");
    });

    it("seguridad: trata el title como texto y no inserta HTML", () => {
        const maliciousTitle = '<img src=x onerror="alert(1)">';
        render(<DuplicateButton title={maliciousTitle} />);

        const button = screen.getByRole("button", { name: maliciousTitle });
        expect(button).toBeInTheDocument();
        expect(button.querySelector("img")).toBeNull();
    });
});
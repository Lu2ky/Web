import { useEffect, useState } from "react";

// Componente botón para agregar comentarios
export const CommentButton = ({
  on_add_comment,
  onboardingButtonId,
  onboardingModalId,
  isDisabled = false,
}) => {
  const [is_open, set_is_open] = useState(false);
  const [is_closing, set_is_closing] = useState(false);
  const [comment_text, set_comment_text] = useState("");
  const [is_saving, set_is_saving] = useState(false);

  const ANIM_DURATION = 150; // ms, debe coincidir con App.css

  const close_with_anim = (after_close) => {
    set_is_closing(true);

    window.setTimeout(() => {
      set_is_open(false);
      set_is_closing(false);

      if (typeof after_close === "function") {
        after_close();
      }
    }, ANIM_DURATION);
  };

  // Alternar visibilidad del formulario
  const toggle_open = () => {
    if (is_open) {
      close_with_anim();
      return;
    }

    set_is_open(true);
    window.dispatchEvent(new CustomEvent("onboarding:official-comment-opened"));
  };

  // Guardar comentario y notificar al padre
  const handle_save = async () => {
    const text_to_send = comment_text.trim();
    if (text_to_send === "" || is_saving || isDisabled) return;

    try {
      set_is_saving(true);
      if (on_add_comment) {
        await Promise.resolve(on_add_comment(text_to_send));
      }

      close_with_anim(() => {
        set_comment_text("");
      });
    } catch (error) {
      console.error("No se pudo guardar el comentario:", error);
    } finally {
      set_is_saving(false);
    }
  };

  // Cancelar edición
  const handle_cancel = () => {
    close_with_anim(() => {
      set_comment_text("");
    });
  };

  useEffect(() => {
    const handleCloseUnrelatedUi = (event) => {
      const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi) ? event.detail.allowOpenUi : [];
      if (!allowOpenUi.includes("dropdown-official-comment")) {
        set_is_open(false);
        set_is_closing(false);
      }
    };

    window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    return () => window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
  }, []);

  // Actualizar texto del comentario
  const handle_change = (evt) => {
    set_comment_text(evt.target.value);
  };

  return (
    <div className="add-comment-container">
      <button
        className="add-comment-button"
        type="button"
        onClick={toggle_open}
        aria-expanded={is_open}
        title="Agregar comentario"
        data-onboarding-id={onboardingButtonId}
        disabled={isDisabled || is_saving}
      >
        <span className="add-comment-plus">+</span>
        <span className="add-comment-label">Agregar Comentario</span>
      </button>

      {is_open && (
        <div className={`add-comment-dropdown ${is_closing ? "hide" : "show"}`} data-onboarding-id={onboardingModalId}>
          <textarea
            className="add-comment-textarea"
            value={comment_text}
            onChange={handle_change}
            placeholder="Escribe tu comentario..."
            rows={4}
            disabled={is_saving || isDisabled}
          />

          <div className="add-comment-actions">
            <button
              className="add-comment-action-button save"
              type="button"
              onClick={handle_save}
              disabled={comment_text.trim() === "" || is_saving || isDisabled}
              title="Guardar comentario"
              aria-label="Guardar comentario"
            >
              {is_saving ? "Guardando..." : "Guardar"}
            </button>

            <button
              className="add-comment-action-button cancel"
              type="button"
              onClick={handle_cancel}
              disabled={is_saving}
              title="Cancelar comentario"
              aria-label="Cancelar comentario"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

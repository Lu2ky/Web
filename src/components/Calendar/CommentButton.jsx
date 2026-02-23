import { useState } from "react";

// Componente botón para agregar comentarios
export const CommentButton = ({ on_add_comment }) => {
  const [is_open, set_is_open] = useState(false);
  const [is_closing, set_is_closing] = useState(false);
  const [comment_text, set_comment_text] = useState("");

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
  };

  // Guardar comentario y notificar al padre
  const handle_save = () => {
    const text_to_send = comment_text.trim();

    close_with_anim(() => {
      if (on_add_comment && text_to_send !== "") {
        on_add_comment(text_to_send);
      }

      set_comment_text("");
    });
  };

  // Cancelar edición
  const handle_cancel = () => {
    close_with_anim(() => {
      set_comment_text("");
    });
  };

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
      >
        <span className="add-comment-plus">+</span>
        <span className="add-comment-label">Agregar Comentario</span>
      </button>

      {is_open && (
        <div className={`add-comment-dropdown ${is_closing ? "hide" : "show"}`}>
          <textarea
            className="add-comment-textarea"
            value={comment_text}
            onChange={handle_change}
            placeholder="Escribe tu comentario..."
            rows={4}
          />

          <div className="add-comment-actions">
            <button
              className="add-comment-action-button save"
              type="button"
              onClick={handle_save}
              disabled={comment_text.trim() === ""}
            >
              Guardar
            </button>

            <button
              className="add-comment-action-button cancel"
              type="button"
              onClick={handle_cancel}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

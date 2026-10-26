import { CommentButton } from "./CommentButton";

export default function ClassCommentsSection({
  comments,
  editingId,
  editText,
  onEditTextChange,
  savingCommentId,
  deletingCommentId,
  isCommentsBusy,
  onAddComment,
  onDeleteComment,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}) {
  return (
    <div className="info-section">
      <h3 className="section-title">Comentarios y Observaciones</h3>
      <CommentButton
        on_add_comment={onAddComment}
        onboardingButtonId="official-comment-button"
        onboardingModalId="official-comment-modal"
        isDisabled={isCommentsBusy}
      />

      {comments.length > 0 && (
        <div className="comments-list">
          {comments.map((comment) => {
            const isEditingThis = editingId === comment.id;
            const isSavingThis = savingCommentId === comment.id;
            const isDeletingThis = deletingCommentId === comment.id;

            return (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-timestamp">{comment.timestamp}</span>
                  <div className="comment-header-actions">
                    <button
                      className={`edit-comment-button${isSavingThis ? " is-loading" : ""}`}
                      onClick={() => onStartEdit(comment)}
                      title="Editar comentario"
                      aria-label="Editar comentario"
                      type="button"
                      disabled={isCommentsBusy && !isEditingThis}
                    >
                      {isSavingThis ? "..." : "✎"}
                    </button>
                    <button
                      className={`delete-comment-button${isDeletingThis ? " is-loading" : ""}`}
                      onClick={() => onDeleteComment(comment.id)}
                      title="Eliminar comentario"
                      aria-label="Eliminar comentario"
                      type="button"
                      disabled={isCommentsBusy && !isDeletingThis}
                    >
                      {isDeletingThis ? "..." : "✕"}
                    </button>
                  </div>
                </div>

                {editingId === comment.id ? (
                  <div className="comment-edit-area">
                    <textarea
                      className="add-comment-textarea"
                      value={editText}
                      onChange={(e) => onEditTextChange(e.target.value)}
                      rows={2}
                      disabled={savingCommentId === comment.id || deletingCommentId !== null}
                    />
                    <div className="add-comment-actions">
                      <button
                        className="add-comment-action-button save"
                        type="button"
                        onClick={() => onSaveEdit(comment.id)}
                        disabled={
                          !editText.trim() ||
                          savingCommentId === comment.id ||
                          deletingCommentId !== null
                        }
                        title="Guardar cambios del comentario"
                        aria-label="Guardar comentario"
                      >
                        {savingCommentId === comment.id ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        className="add-comment-action-button cancel"
                        type="button"
                        onClick={onCancelEdit}
                        disabled={savingCommentId === comment.id || deletingCommentId !== null}
                        title="Cancelar edición del comentario"
                        aria-label="Cancelar"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="comment-text">{comment.text}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {comments.length === 0 && (
        <p className="no-comments">Aun no hay comentarios para esta asignatura.</p>
      )}
    </div>
  );
}

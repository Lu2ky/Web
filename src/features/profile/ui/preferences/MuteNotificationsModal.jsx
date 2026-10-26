import Modal from "../../../../shared/ui/Modal";

export default function MuteNotificationsModal({
  isOpen,
  isSavingMute,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="¿Silenciar notificaciones?"
      confirmLabel="Sí, silenciar"
      closeLabel="Cancelar"
      onConfirm={isSavingMute ? null : onConfirm}
    >
      {isSavingMute ? (
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <div className="spinner" style={{ marginBottom: "1rem" }}></div>
          <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>
            Silenciando notificaciones...
          </p>
        </div>
      ) : (
        <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
          Se desactivarán todas tus notificaciones. ¿Deseas continuar?
        </p>
      )}
    </Modal>
  );
}

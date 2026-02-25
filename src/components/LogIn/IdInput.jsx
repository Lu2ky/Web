function IdInput({ userId, setUserId, onSubmit }) {
  const handleSubmit = () => {
    console.log("ID enviado:", userId);
    onSubmit(userId);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <input
        type="text"
        placeholder="Ingresa tu ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{
          padding: "0.5rem",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginRight: "0.5rem",
        }}
      />
      <button onClick={handleSubmit}>Guardar</button>
    </div>
  );
}

export default IdInput;

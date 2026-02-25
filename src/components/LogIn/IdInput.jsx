import "../../Styles/IdInput.css";
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
      />
      <button onClick={handleSubmit}>Guardar</button>
    </div>
  );
}

export default IdInput;

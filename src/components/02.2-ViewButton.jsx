import "../styles/ViewButton.css";

const options = ["Semanal", "Diario"];

function ViewButton({viewMode, setViewMode}) {
    const selected = options.indexOf(viewMode);

    return (
        <div className="segmented">
            <div
                className="indicator"
                style={{transform: `translateX(${selected * 100}%)` }}
            />
            {options.map((option, index) => (
                <button
                    key={option}
                    className={index === selected ? "active" : ""}
                    onClick={() => setViewMode(option)}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}
export default ViewButton;

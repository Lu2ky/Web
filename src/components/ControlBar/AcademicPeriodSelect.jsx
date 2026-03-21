import { useEffect, useRef, useState } from "react";

function AcademicPeriodSelect({ periods = [], selectedPeriod = "Todos", onPeriodChange = () => {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLabel = selectedPeriod || "Todos";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (period) => {
    onPeriodChange(period);
    setIsOpen(false);
  };

  return (
    <div className="academicPeriodSelectWrapper" ref={dropdownRef}>
      <button
        className="academicPeriodButton"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        title="Seleccionar periodo académico"
        type="button"
      >
        Periodo: {currentLabel}
      </button>

      {isOpen && (
        <ul className="academicPeriodMenu">
          {periods.length === 0 ? (
            <li>
              <button className="academicPeriodOption" type="button" disabled>
                Sin periodos
              </button>
            </li>
          ) : (
            periods.map((period) => (
              <li key={period}>
                <button
                  className={`academicPeriodOption ${selectedPeriod === period ? "selected" : ""}`}
                  onClick={() => handleSelect(period)}
                  type="button"
                  title={`Seleccionar ${period}`}
                >
                  {period}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default AcademicPeriodSelect;

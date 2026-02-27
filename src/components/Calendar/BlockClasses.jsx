import baseBlock from "./BaseBlock";

// Componente de tarjeta de actividad
// Se usa export const porque se pueden exportar múltiples componentes de este archivo.

export const BlockClasses = (props) =>{
  
  const {
    subject_name, //Materia
    professor_name, //Profesor
    classroom, 
    nrc, //Etiqueta de tipo de clase (Teoría, Laboratorio, etc.)
    start_time,
    end_time,
    background_color, // Color por defecto 
    style,
    onClick
  }=props;

  return (
    <BaseBlock
      background_color={background_color}
      style={style}
      onClick={onClick}
    >
      <div className="activity-card-header">
        <div className="activity-card-left">
          <h3>{subject_name}</h3>
          <p>{professor_name}</p>
        </div>
        <div>{start_time} - {end_time}</div>
      </div>
      <div className="activity-card-footer">
        <span>{classroom}</span>
        {nrc && <span>NRC {nrc}</span>}
      </div>
    </BaseBlock>
  );
};

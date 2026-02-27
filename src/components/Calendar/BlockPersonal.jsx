import baseBlock from "./BaseBlock";

// Componente de tarjeta de actividad (versión simplificada sin NRC ni profesor)
export const BlockPersonal = ({
  id,
  subject_name,
  classroom,
  start_time,
  end_time,
  background_color = "#b855d5",
  style = {},
  onDelete = () => {},
}) => {
  return (
    <BaseBlock
      background_color={background_color}
      style={style}
    >
      <button
        className="activity-delete-button"
        onClick={(e)=>{
          e.stopPropagation();
          onDelete(id);
        }}
      >
        ✖︎
      </button>
      <div className="activity-card-header">
        <h3>{subject_name}</h3>
        <div>{start_time} - {end_time}</div>
      </div>
      <div className="activity-card-footer">
        <span>{classroom}</span>
      </div>
    </BaseBlock>
  );
};

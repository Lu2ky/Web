import "../../styles/ControlBar.css";
import ViewButton from "./ViewButton";

function ControlBar({viewMode, setViewMode}) {
    /*const [selectedTag, setSelectedTag] = useState("Todo");*/

    return (
        <div className="controlBar">
            <ViewButton viewMode={viewMode} setViewMode={setViewMode} />
        </div>
    );
}

export default ControlBar;
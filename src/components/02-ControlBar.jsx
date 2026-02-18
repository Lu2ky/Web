import { useState } from "react";
import "../styles/ControlBar.css";
import WeekMover from "./02.1-WeekMover";
import ViewButton from "./02.2-ViewButton";
import AddButton from "./02.3-AddActivityButton";
import FilterButton from "./02.4-FilterButton";
import ThemeSelect from "./02.5-ThemeSelector";

function ControlBar({viewMode, setViewMode, onActivitySaved}) {
    const [selectedTag, setSelectedTag] = useState("Todo");

    return (
        <div className="ControlBar">
            <div className="Left">
                <ViewButton viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            <div className="Center">
                <WeekMover />
            </div>
            <div className="Right">
                <AddButton onActivitySaved={onActivitySaved} />
                <FilterButton selectedTag={selectedTag} setSelectedTag={setSelectedTag} />
                <ThemeSelect />
            </div>
        </div>
    );
}

export default ControlBar;
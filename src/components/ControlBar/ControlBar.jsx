import { useState } from "react";
import "../../styles/ControlBar.css";
import WeekMover from "./WeekMover";
import ViewButton from "./ViewButton";
import AddButton from "./AddActivityButton";
import FilterButton from "./FilterButton";
import ThemeSelect from "./ThemeSelector";

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
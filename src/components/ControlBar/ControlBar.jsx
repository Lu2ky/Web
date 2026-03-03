import { useState } from "react";
import "../../styles/ControlBar.css";
import WeekMover from "./WeekMover";
import ViewButton from "./ViewButton";
import AddButton from "./AddActivityButton";
import FilterButton from "./FilterButton";
import ThemeSelect from "./ThemeSelector";

function ControlBar({viewMode, setViewMode, userId, onActivityAdd, onThemeChange, selectedTag, setSelectedTag}) {

    return (
        <div className="ControlBar">
            <div className="Left">
            <ViewButton viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            <div className="Center">
            </div>
            <div className="Right">
                <AddButton userId={userId} onActivityAdd={onActivityAdd} />
                <FilterButton selectedTag={selectedTag} setSelectedTag={setSelectedTag} />
                <ThemeSelect onThemeChange={onThemeChange} />
            </div>
        </div>
    );
}

export default ControlBar;
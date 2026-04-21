import "../../styles/ControlBar/ControlBar.css";
import ViewButton from "./ViewButton";
import AddButton from "./AddActivityButton";
import FilterButton from "./FilterButton";
import ThemeSelect from "./ThemeSelector";
import AcademicPeriodSelect from "./AcademicPeriodSelect";

function ControlBar({viewMode, setViewMode, userId, idCourse, onActivityAdd, onThemeChange, selectedTag, setSelectedTag, onPeriodChange, weekOffset, setWeekOffset}) {
    return (
        <div className="ControlBar" data-onboarding-id="controlbar">
            <div className="Left">
            <ViewButton viewMode={viewMode} setViewMode={setViewMode} />
            </div>
            <div className="Center">
            </div>
            <div className="Right">
                <AcademicPeriodSelect onPeriodChange={onPeriodChange} />
                <AddButton userId={userId} idCourse={idCourse} onActivityAdd={onActivityAdd} />
                <FilterButton selectedTag={selectedTag} setSelectedTag={setSelectedTag} />
                <ThemeSelect userId={userId} onThemeChange={onThemeChange} />
            </div>
        </div>
    );
}

export default ControlBar;
import ParametersButton from "./ParametersButton";
import ImportButton from "./ImportButton";
import PrivilegesButton from "./PrivilegesButton";
import OverviewAdmin from "./OverviewAdmin";
import "../../Styles/AdminView.css";

function AdminView() {
    return (
        <div className="adminView">
            <div className="adminView__sidebar">
                <ParametersButton />
                <ImportButton />
                <PrivilegesButton />
            </div>

            <div className="adminView__overview">
                <OverviewAdmin />
            </div>
        </div>
    );
}

export default AdminView;
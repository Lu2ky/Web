import Header from "./components/Navegation/Header";
import ParametersButton from "./components/Account/JSX ViewAdmin/ParametersButton";
import ImportButton from "./components/Account/JSX ViewAdmin/ImportButton";
import PrivilegesButton from "./components/Account/JSX ViewAdmin/PrivilegesButton";
import OverviewAdmin from "./components/Account/JSX ViewAdmin/OverviewAdmin";
import "./AdminView.css";

function AdminView() {
    return (
        <div className="adminViewContainer">
            <div className="adminView__header">
                <Header />
            </div>
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
        </div>
    );
}

export default AdminView;
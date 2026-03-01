
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LogInForm from "./LogInForm";
import App from "./App"; 
import RecoverPassword from "./RecoverPassword";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<LogInForm />} />
			<Route path="/RecoverPassword" element={<RecoverPassword />} />
			<Route path="/app/:userId" element={<App />} />
		</Routes>
	</BrowserRouter>
);



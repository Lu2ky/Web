// Librerias para manejo de rutas y renderizado
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Componentes de la aplicación
import LogInForm from "./LogInForm";
import App from "./App"; 
import RecoverPassword from "./RecoverPassword";
import AdminView from "./AdminView";
import RestorePassword from "./RestorePassword";
import TokenPassword from "./TokenPassword";

import "./index.css";
// Renderizado de la aplicación con rutas definidas, solo se puede una ruta a la vez 
// Crea un root para renderizar la aplicación en el elemento con id "root"
// BrowserRouter para manejar las rutas de la aplicación sin recargar la página
// Render() para renderizar los componentes según la ruta actual
// Routes es un contenedor que evalúa las rutas definidas y renderiza el componente correspondiente
ReactDOM.createRoot(document.getElementById("root")).render( 
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<LogInForm />} />
			<Route path="/RecoverPassword" element={<RecoverPassword />} />
			<Route path="/App/:userId" element={<App />} />
			<Route path="/AdminView" element={<AdminView />} />
			<Route path="/RestorePassword" element={<RestorePassword />} />
			<Route path="/TokenPassword" element={<TokenPassword />} />
			 {/* Ruta para manejar cualquier ruta no definida, redirigiendo al login */}
			<Route path="*" element={<LogInForm />} />
		</Routes>
	</BrowserRouter>
);



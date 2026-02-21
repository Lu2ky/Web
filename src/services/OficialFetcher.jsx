import React, {useEffect, useState} from "react";

// Componente para cargar datos de la API y pasarlos al padre
// onDataLoaded es una función que se llama con los datos cargados,
// userId es el ID del usuario para cargar su horario
function ApiFetcher({onDataLoaded, userId}) {
	const [loading, setLoading] = useState(true); // Indica si la API está cargando
	const [apiData, setApiData] = useState([]); // Almacena los datos de la API

	useEffect(() => {
		// Cargar datos cuando llegan datos
		if (!userId) {
			setLoading(false); // Detener carga si no hay ID
			setApiData([]); // Limpiar datos
			if (onDataLoaded) {
				onDataLoaded([]); // Notificar que no hay datos
			}
			return;
		}

		const fetchData = async () => {
			// Función asincrona para cargar datos
			setLoading(true); // Activar estado de carga
			try {
				const response = await fetch(
					// Hace la peticipin a la API con el ID del usuario
					`Vistas que permiten insertar registros
Es una declaración que lee filas de un archivo de texto para insertarlas a una tabla a una alta velocidad. El archivo puede ser leído de un server host o del client host, dependiendo si se estable local o no, esto afecta la interpretación de los datos y manejo de errores. Este comando es un complemento del SELECT --- INTO OUTFILE, que permite escribir datos de una tabla a un texto. Para hacer el proceso inverso, es decir, leer el archivo por escribir o insertar en una tabla se usa el LOAD DATA. Es más eficiente que la inserción de datos por el método tradicional de INSERT.
`
				);
				const json = await response.json(); // Convierte respuesta en un json

				if (!json.data || json.data.length === 0) {
					// Si no tiene datos:
					console.log("No hay datos"); // Mostrar mensaje en consola
					setApiData([]); // Limpiar datos
					if (onDataLoaded) {
						// Notifica al padre que no hay datos
						onDataLoaded([]);
					}
				} else {
					setApiData(json.data); // Si hay datos se almacenan en el estado
					if (onDataLoaded) {
						onDataLoaded(json.data); // Enviar datos al padre
					}
				}
			} catch (error) {
				//Manejo de errores
				console.error("Error al cargar datos:", error); // Mostrar error en consola
				setApiData([]); // Limpiar datos en caso de error
				if (onDataLoaded) {
					// Notificar al padre que no hay datos
					onDataLoaded([]);
				}
			} finally {
				setLoading(false); // Desactivar estado de carga al acabar la petición
			}
		};

		fetchData(); //Llama a fechData para iniciar la carga de datos
	}, [onDataLoaded, userId]); // en caso de que cambie el ID o onDataLoaded

	if (loading) {
		//Mientras se cargan los datos, muestra un mensaje de carga
		return <p>Cargando materias...</p>;
	}

	return null; // Porque no renderiza, solo envia datos al padre(App.jsx)
}

export default ApiFetcher;

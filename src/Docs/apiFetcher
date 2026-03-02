import { useEffect, useState } from "react";

function ApiFetcher({ url, method = "GET", payload = null, onDataLoaded }) { // Componente para hacer peticiones a la API
    const [loading, setLoading] = useState(true); // Estado para controlar si se están cargando los datos
    const [apiData, setApiData] = useState(null); // Estado para almacenar los datos obtenidos de la API

    useEffect(() => { // Efecto que se ejecuta cada vez que cambian url, method, payload o onDataLoaded
        const fetchData = async () => { // Función asincrona para hacer la petición a la API
            setLoading(true); // Activar el estado de carga antes de hacer la petición
            try {
                const response = await fetch(url, { // Hacer la petición a la API con la URL, método y payload especificados
                    method, // Método HTTP (GET, POST, etc.)
                    headers: { "Content-Type": "application/json" }, // Encabezados para indicar que se envía JSON
                    body: method !== "GET" && payload ?
                        JSON.stringify(payload) :
                        undefined, // Si el método no es GET y hay payload, convertirlo a JSON, de lo contrario no enviar body
                }); 
                const json = await response.json(); // Convertir la respuesta a JSON
                console.log("Respuesta cruda de la API:", json);
                setApiData(json); // Almacenar los datos obtenidos en el estado
                if (onDataLoaded) onDataLoaded(json); // Si se proporcionó la función onDataLoaded, llamarla con los datos obtenidos    
            } catch (error) { // Manejo de errores en caso de que la petición falle
                console.error("Error:", error);
                setApiData(null); // Limpiar los datos en caso de error
                if (onDataLoaded) onDataLoaded(null);  // Notificar al padre que no se pudieron cargar los datos
            } finally {  // Finalmente, desactivar el estado de carga después de que la petición se complete o falle
                setLoading(false);
            }
        };
        fetchData();   // Llamar a la función fetchData para iniciar la petición a la API
    }, [url, method, payload, onDataLoaded]);   // El efecto se ejecutará cada vez que cambien url, method, payload o onDataLoaded       

    if (loading) {
        return(
            <div className="loading-container">
                <div className="bar"></div>
                <p>Cargando...</p>
            </div>
        ) 
    }
    return null;
}

export default ApiFetcher;

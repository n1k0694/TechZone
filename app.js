const express = require('express');
const app = express();
const routes = require('./Routes/Routes'); // Importa tus nuevas rutas fijadas por la tarea
const PORT = 3000;

// Middlewares para procesar datos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar las rutas del proyecto
app.use('/', routes);

// Iniciar el servidor backend
app.use(express.static('Views')); // Permite que tus HTML carguen recursos adicionales si es necesario
app.listen(PORT, () => {
    console.log(`Servidor de TechZone corriendo en http://localhost:${PORT}`);
});
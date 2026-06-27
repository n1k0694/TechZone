const express = require('express');
const path = require('path'); // <-- SOLUCIÓN: Importación del módulo nativo necesaria para path.join
const routes = require('./Routes/Routes'); 

const app = express();
const PORT = 3000;

// 1. Middlewares para procesar datos (JSON y formularios)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
// Permite que se sirvan los HTML de la carpeta 'Views' de forma directa
app.use(express.static(path.join(__dirname, 'Views'))); 

// ADAPTACIÓN: Expone la carpeta interna 'views/js' de forma pública bajo la URL '/js'
app.use('/js', express.static(path.join(__dirname, 'Views', 'js')));

// 3. CONECTAR LAS RUTAS DEL PROYECTO (Siempre después de los middlewares y estáticos)
app.use('/', routes);

// 4. INICIAR EL SERVIDOR BACKEND
app.listen(PORT, () => {
    console.log(`Servidor de TechZone corriendo en http://localhost:${PORT}`);
});
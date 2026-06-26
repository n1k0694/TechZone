const express = require('express');
const router = express.Router();
const controllers = require('../Controllers/controllers');

// Rutas para mostrar las páginas HTML
router.get('/', controllers.renderIndex);
router.get('/pagina2', controllers.renderPagina2);
router.get('/pagina3', controllers.renderPagina3);

// NUEVAS RUTAS DE DATOS (API)
// Esta ruta la usaremos para rellenar la tabla HTML dinámicamente
router.get('/api/productos', controllers.getProductosFormateados);

// Esta ruta procesará los datos mediante POST para evaluar los Regex
router.post('/api/validar', controllers.validarFormulario);

module.exports = router;
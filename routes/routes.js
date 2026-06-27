const express = require('express');
const router = express.Router();
const controllers = require('../Controllers/controllers');

// 1. RUTAS DE NAVEGACIÓN (VISTAS HTML)
router.get('/', controllers.renderindex);
router.get('/pagina2', controllers.renderPagina2); // Nosotros
router.get('/pagina3', controllers.renderPagina3); // Contacto
router.get('/pagina4', controllers.renderPagina4); // Stock Inventario
router.get('/pagina5', controllers.renderPagina5); // Cotizador

// 2. ENDPOINTS DE LA API (TRANSACCIONALES)
router.get('/api/productos', controllers.getProductosFormateados);
router.post('/api/inventario/agregar', controllers.agregarInventario); // Admin suma stock
router.post('/api/ventas/comprar', controllers.procesarVenta);        // Cliente resta stock
router.post('/api/validar', controllers.validarDatosCotizacion);

module.exports = router;
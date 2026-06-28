const express = require('express');
const router = express.Router();
const controllers = require('../Controllers/controllers');

// ==========================================
// 1. RUTAS PARA CARGAR LAS PÁGINAS (HTML)
// ==========================================

// Pantalla de inicio (Home)
router.get('/', controllers.renderindex);

// Página de Quiénes Somos
router.get('/pagina2', controllers.renderPagina2); 

// Página de Formulario de Contacto
router.get('/pagina3', controllers.renderPagina3); 

// Panel de administración para ver y cargar stock de productos
router.get('/pagina4', controllers.renderPagina4); 

// Pantalla del cotizador con el carro de compras
router.get('/pagina5', controllers.renderPagina5); 

// Pantalla del historial de cotizaciones emitidas
router.get('/pagina6', controllers.renderPagina6);


// ==========================================
// 2. ENLACES DE LA API (ACCIONES Y DATOS)
// ==========================================

// Trae los productos de la base de datos con el precio formateado a pesos chilenos
router.get('/api/productos', controllers.getProductosFormateados);

// Cuando el administrador suma stock y cambia la categoría desde la consola de carga
router.post('/api/inventario/agregar', controllers.agregarInventario); 

// Cuando se hace una venta directa y hay que restar del stock
router.post('/api/ventas/comprar', controllers.procesarVenta);        

// Guarda la cotización y los datos del cliente de forma segura en la base de datos
router.post('/api/validar', controllers.validarDatosCotizacion);

// Ruta para registrar un producto completamente nuevo en la BD
router.post('/api/productos/nuevo', controllers.crearNuevoProducto);


// ==========================================
// 3. REVISIÓN HISTÓRICA Y VISTA PDF
// ==========================================

// Trae la lista de todas las cotizaciones hechas para el historial
router.get('/api/cotizaciones', controllers.obtenerHistorialCotizaciones);

// CORRECCIÓN: Se cambió 'renderizarCotizacionAlVuelo' por la función real 'renderCotizacionVisual'
router.get('/cotizacion/ver/:id', controllers.renderCotizacionVisual);

module.exports = router;
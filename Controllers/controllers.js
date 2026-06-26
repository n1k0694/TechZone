const path = require('path');
const db = require('../Config/db'); // Asegúrate de que la carpeta se llame 'Config' con C mayúscula

/**
 * -------------------------------------------------------------------
 * 1. CONTROLADORES DE VISTAS (PÁGINAS HTML)
 * -------------------------------------------------------------------
 */

// Servir index.html
const renderIndex = (req, res) => {
    const rutaIndex = path.resolve(__dirname, '..', 'Views', 'index.html');
    res.sendFile(rutaIndex);
};

// Servir pagina2.html
const renderPagina2 = (req, res) => {
    const rutaPagina2 = path.resolve(__dirname, '..', 'Views', 'pagina2.html');
    res.sendFile(rutaPagina2);
};

// Servir pagina3.html
const renderPagina3 = (req, res) => {
    const rutaPagina3 = path.resolve(__dirname, '..', 'Views', 'pagina3.html');
    res.sendFile(rutaPagina3);
};


/**
 * -------------------------------------------------------------------
 * 2. CONTROLADORES DE LÓGICA Y DATOS (API)
 * -------------------------------------------------------------------
 */

// Obtener productos desde MySQL y procesar con JavaScript
const getProductosFormateados = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nombre, categoria, stock, precio FROM productos;');

        // Método iterativo 1: .filter()
        const productosConStock = rows.filter(producto => producto.stock);

        // Método iterativo 2: .map()
        const productosFinales = productosConStock.map(producto => {
            return {
                id: producto.id,
                nombre: producto.nombre,
                categoria: producto.categoria,
                stock: producto.stock,
                precioFormateado: `$${producto.precio.toLocaleString('es-CL')}`
            };
        });

        res.json(productosFinales);
    } catch (error) {
        console.error("Error en la base de datos:", error);
        res.status(500).json({ error: 'Hubo un problema al conectar con la base de datos' });
    }
};

// Validar datos con Expresiones Regulares (Regex)
const validarFormulario = (req, res) => {
    const { email, telefono } = req.body;

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexTelefono = /^(\+?56)? ?9 \d{4} \d{4}$|^(\+?56)? ?9\d{8}$/;

    const esEmailValido = regexEmail.test(email);
    const esTelefonoValido = regexTelefono.test(telefono);

    if (!esEmailValido || !esTelefonoValido) {
        return res.status(400).json({
            success: false,
            message: 'Error de validación: El formato del correo o del teléfono es incorrecto.',
            errores: { email: esEmailValido, telefono: esTelefonoValido }
        });
    }

    res.json({
        success: true,
        message: '¡Validación Regex exitosa! Los formatos son correctos.'
    });
};


/**
 * -------------------------------------------------------------------
 * 3. EXPORTACIÓN ÚNICA (Al final del archivo)
 * -------------------------------------------------------------------
 */
module.exports = {
    renderIndex,
    renderPagina2,
    renderPagina3,
    getProductosFormateados,
    validarFormulario
};
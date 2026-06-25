// Importar Express y Path
const express = require("express");
const path = require("path");
const mysql = require("mysql2");

// Crear la aplicación Express
const app = express();

//conexion MySQL

const db = mysql.createConnection({
    host: 'localhost',
    user: "root",
    password: "",
    database: "fgammer_db"
});

// prueba de conexion 
db.connect(err => {
    if (err) {
        console.error("Error al conectar a MYSQL: ", err);
        return;
    }
    console.log("Conectado a la base de datos MySQL");
});

//conexion a noticias en mysql

app.get("/api/noticias", (req, res) => {
    db.query("SELECT titulo, contenido FROM noticias", (err, results) => {
        if (err) {
            console.error("Error al consultar noticias:", err);
            res.status(500).send("Error en el servidor");
            return;
        }
        res.json(results);
    });
});

// Middleware para procesar JSON
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("Servidor Node.js funcionando con Express - Que dios nos pille confesados...");
});

// Ruta server local (sirve archivos estáticos de semana03)
app.use("/semana03", express.static(path.resolve("C:/wamp64/www/semana03")));

// Ruta para noticias (ejemplo actualizado con temática gamer en Chile)
// app.get("/api/noticias", (req, res) => {
//     const noticias = [
//         {
//             id: 1,
//             titulo: "Nueva tarjeta gráfica RTX 5090 llega a Chile",
//             contenido: "Los principales retailers anunciaron la llegada de la nueva RTX 5090, con mejoras en rendimiento para juegos AAA y soporte avanzado de inteligencia artificial. Se espera alta demanda en la comunidad gamer."
//         },
//         {
//             id: 2,
//             titulo: "Auge de los periféricos gamer en Santiago",
//             contenido: "Tiendas locales reportan un aumento en la venta de teclados mecánicos, sillas gamer y monitores de alta frecuencia. La tendencia refleja el crecimiento del mercado de insumos gamer en Chile."
//         }
//     ];
//     res.json(noticias);
// });

// Iniciar servidor
app.listen(3000, () => {
    console.log("Servidor ejecutándose en http://localhost:3000");
});

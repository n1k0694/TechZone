# Proyecto Web Dinámico - Catálogo y Carrito de Compras

---

## Semana 4 - Catálogo y Carrito de Compras con Persistencia Local

Este proyecto corresponde a la **Etapa 3: Planificación e integración de JavaScript en backend** para la asignatura **Programación Web**. La aplicación transforma una maqueta estática en una plataforma interactiva implementando una arquitectura desacoplada en capas cliente-servidor, garantizando la persistencia local y la manipulación dinámica de datos.

### Arquitectura del Sistema (Modelo de 3 Capas)

```
+-------------------------------------------------------+
|               CAPA DE PRESENTACIÓN (UI)               |
|       - index.html (Estructura Semántica HTML5)       |
|       - css/estilos.css (Estilos Visuales CSS3)       |
+---------------------------+---------------------------+
                                |
               Peticiones DOM   |   Inyección Dinámica
               e Interacción    |   de Nodos (Render)
                                v
+-------------------------------------------------------+
|                CAPA DE LÓGICA (Scripts)               |
|       - js/app.js (Controlador / Eventos / Cookies)   |
+---------------------------+---------------------------+
                                |
             Lectura Local   |   Persistencia / Estado
               de Objetos    |   (JSON stringify)
                             v
+-------------------------------------------------------+
|                     CAPA DE DATOS                     |
|       - js/app.js (Arreglo de Objetos / Catálogo)     |
|       - Almacenamiento Local (Cookies del Navegador)  |
+-------------------------------------------------------+
```

### Ejecución del Proyecto
El proyecto se ejecuta en un servidor HTTP local (XAMPP, Python o Live Server) para garantizar el correcto funcionamiento de la persistencia en cookies.

### Depuración
Se utilizan herramientas del navegador (Console y Application > Cookies) para verificar la ejecución de eventos y la estructura del JSON del carrito.

---

## Semana 5 - Integración Backend con Node.js y MySQL

En esta etapa se amplió el proyecto para integrar un **backend con Node.js + Express + MySQL**, permitiendo que los datos se gestionen desde un servidor y una base de datos en lugar de estar definidos directamente en el frontend.

### Estructura del Proyecto
```
SEMANA03/
│
├── index.html          # Página principal (productos gamer)
├── noticias.html       # Página de noticias dinámicas
│
├── css/style.css       # Estilos personalizados
├── js/app.js           # Scripts frontend
├── files/              # Componentes reutilizables (header, footer)
├── img/                # Imágenes del sitio
│
└── backend/
    ├── server.js       # Servidor Node.js con Express
    ├── package.json    # Configuración de dependencias
    └── package-lock.json
```

### Funciones de Archivos
- **server.js**: define el servidor Express, rutas `/` y `/api/noticias`, y sirve la carpeta `semana03`.  
- **index.html**: página principal con catálogo de productos gamer.  
- **noticias.html**: acordeón Bootstrap que consume datos dinámicos desde `/api/noticias`.  
- **css/style.css** y **js/app.js**: estilos y lógica de interacción en el frontend.  

### Conexión a la Base de Datos
- Base de datos: `fgammer_db`.  
- Tabla:  
  - `noticias` → contiene títulos y contenidos de noticias gamer.  
- La conexión se implementa con el módulo `mysql2` en Node.js.  
- Se recomienda implementar la base de datos en entornos locales como **LAMPP** o **WAMP**, asegurando compatibilidad con MySQL y phpMyAdmin para la gestión de tablas.

### Código SQL de Creación de Base de Datos
```sql
-- Base de datos principal
CREATE DATABASE fgammer_db;

USE fgammer_db;

-- Tabla de noticias gamer
CREATE TABLE noticias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL
);
```

### Integración Frontend-Backend
- El frontend consume datos mediante `fetch` desde la ruta `/api/noticias`.  
- Los datos se muestran dinámicamente en el acordeón de la página `noticias.html`.  

### Semana 6 — Consolidación del Ecosistema Transaccional y Documental (TechZone SpA)
# Para el cierre del ciclo de desarrollo, la arquitectura del software evolucionó hacia una plataforma empresarial modular bajo el patrón Modelo-Vista-Controlador (MVC), migrando el # núcleo del negocio desde un enfoque genérico de noticias hacia un Sistema Transaccional de Gestión de Inventarios y Emisión de Cotizaciones Corporativas (TechZone SpA).

Arquitectura del Sistema (Evolución MVC)
+-------------------------------------------------------+
|                 VISTAS (FRONTEND DOM)                 |
|  - pagina4.html (Consola de Carga e Inventario Real)  |
|  - pagina5.html (Módulo Presupuestario e Inserción)   |
|  - pagina6.html (historico de cotizaciones)   |
+---------------------------+---------------------------+
              |                             ^
       Peticiones Fetch             Mapeo de Datos
       (JSON / Payloads)            e Inyección (.forEach)
              v                             |
+-------------------------------------------------------+
|               CONTROLADORES (BACKEND API)             |
|  - controllers.js (Reglas de Negocio / Validaciones)  |
|  - Transacciones Atómicas (beginTransaction / Commit) |
+---------------------------+---------------------------+
              |                             ^
        Consultas SQL               Colección de Filas
        Parametrizadas              (Rows / InsertId)
              v                             |
+-------------------------------------------------------+
|               PERSISTENCIA (DATOS MYSQL)              |
|  - Base de Datos Motor InnoDB: `techzone_db`          |
|  - Integridad Referencial Estricta (Foreign Keys)     |
+-------------------------------------------------------+
# Optimizaciones Estructurales y Relacionales
# Durante este sprint final, se implementaron refinamientos clave en la base de datos y la lógica del servidor para robustecer la seguridad y escalabilidad del sistema:

# Aislamiento del Catálogo (Desacoplamiento de Usuarios): Se eliminaron las restricciones y dependencias directas de llaves foráneas (FOREIGN KEY) asociadas a la tabla de usuarios 
# en los módulos de ventas y movimientos_stock. Esto permite un despliegue y poblamiento ágil y autónomo del inventario enfocado netamente en la operación comercial, manteniendo los 
# campos de referencia por compatibilidad con el backend.

# Persistencia Nativa de Clientes: Se reestructuró la tabla cotizaciones agregando campos estructurados obligatorios como cliente_nombre, eliminando por completo excepciones por 
# campos nulos.

# Robustez Transaccional en Capa Backend: El método validarDatosCotizacion en controllers.js fue blindado mediante el uso coordinado de un pool de conexiones y bloques de control 
# atómico (beginTransaction(), commit() y rollback()). Si ocurre un fallo de stock o un quiebre en las llaves foráneas remanentes al insertar los detalles, el sistema revierte 
# automáticamente cualquier mutación parcial en la base de datos.

# Validaciones de Entrada Estrictas: Se incorporaron expresiones regulares nativas en Node.js para sanear y validar el formato de correos electrónicos y números de contacto chilenos 
# (celulares de 9 dígitos) previos al asentamiento de documentos.

# Código SQL del Modelo Relacional Consolidado
# SQL
CREATE TABLE IF NOT EXISTS `cotizaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero_documento` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_telefono` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto_neto` int NOT NULL DEFAULT '0',
  `monto_iva` int NOT NULL DEFAULT '0',
  `total_general` int NOT NULL DEFAULT '0',
  `fecha_emision` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_numero_documento` (`numero_documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_cotizaciones`
--

CREATE TABLE IF NOT EXISTS `detalle_cotizaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cotizacion_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` int NOT NULL,
  `subtotal` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_cotizacion_parent` (`cotizacion_id`),
  KEY `fk_detalle_cotizacion_producto` (`producto_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE IF NOT EXISTS `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio` int NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

# Integración Frontend e Iteración Dinámica (Rúbricas Front)
# El front-end utiliza arreglos globales mapeados (matrizInventario) que interactúan mediante métodos avanzados de JavaScript moderno como .filter() para aislar productos con 
# existencias al vuelo de manera local.

# Para pintar dinámicamente las tablas tanto en la consola de carga como en el visor de documentos renderizados al vuelo, se utilizan estructuras iterativas .forEach(), inyectando 
# cadenas semánticas interpoladas al DOM con badges dinámicos condicionales según el nivel crítico de stock.

# Conclusión
# El proyecto evolucionó exitosamente desde un catálogo elemental con persistencia en cookies (Semana 4) y un backend rudimentario de noticias (Semana 5), hasta consolidarse como un 
# sistema transaccional completo, seguro y desacoplado (Semana 6). La implementación del patrón de arquitectura MVC, el control estricto de transacciones relacionales, y la 
# renderización de reportes comerciales válidos en Chile demuestran una integración cliente-servidor robusta, cumpliendo con los estándares de ingeniería de software requeridos para # la defensa técnica del proyecto.
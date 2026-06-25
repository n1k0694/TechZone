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

---

## Conclusión

El proyecto evolucionó de un **catálogo con persistencia local (Semana 4)** a un sistema completo con **backend en Node.js, Express y MySQL (Semana 5)**. La estructura ahora incluye un servidor, una ruta dinámica y conexión a la base de datos, lo que permitiría alimentar una página llamada `noticias.html` con datos reales. Esto cumple con los objetivos de la actividad formativa y demuestra una integración cliente-servidor más robusta y profesional.

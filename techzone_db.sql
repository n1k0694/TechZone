-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 27-06-2026 a las 03:07:36
-- Versión del servidor: 8.4.7
-- Versión de PHP: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `techzone_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_ventas`
--

DROP TABLE IF EXISTS `detalle_ventas`;
CREATE TABLE IF NOT EXISTS `detalle_ventas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_venta` (`venta_id`),
  KEY `fk_detalle_producto` (`producto_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_stock`
--

DROP TABLE IF EXISTS `movimientos_stock`;
CREATE TABLE IF NOT EXISTS `movimientos_stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `producto_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mov_producto` (`producto_id`),
  KEY `fk_mov_usuario` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `movimientos_stock`
--

INSERT INTO `movimientos_stock` (`id`, `producto_id`, `usuario_id`, `cantidad`, `fecha`) VALUES
(1, 13, 1, 1, '2026-06-26 13:34:31');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

DROP TABLE IF EXISTS `productos`;
CREATE TABLE IF NOT EXISTS `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio` int NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `nombre`, `categoria`, `precio`, `stock`) VALUES
(1, 'Gabinete Gamer Corsair iCUE', 'Gabinetes', 120000, 5),
(2, 'Memoria RAM Kingston Fury 16GB', 'Componentes', 45000, 12),
(3, 'Tarjeta de Video ASUS RTX 4060', 'Componentes', 380000, 3),
(4, 'Mouse Logi G Pro X Superlight', 'Perifericos', 110000, 0),
(5, 'Teclado Mecanico Redragon Mitra', 'Perifericos', 35000, 8),
(6, 'Gabinete Gamer Corsair iCUE Link 3500X', 'Gabinetes', 129990, 5),
(7, 'Gabinete Lian Li O11 Dynamic EVO', 'Gabinetes', 165000, 3),
(8, 'Memoria RAM Kingston Fury Beast 16GB DDR5', 'Componentes', 58990, 24),
(9, 'Tarjeta de Video ASUS ROG Strix RTX 4060 Ti', 'Componentes', 485000, 4),
(10, 'Procesador AMD Ryzen 7 7800X3D AM5', 'Componentes', 399990, 8),
(11, 'Fuente de Poder Seasonic Focus GX-850 Gold', 'Componentes', 115000, 10),
(12, 'Disco SSD M.2 NVMe WD Black SN850X 1TB', 'Componentes', 95000, 0),
(13, 'Mouse Logi G Pro X Superlight 2 Wireless', 'Perifericos', 134990, 1),
(14, 'Teclado Mecánico Redragon Mitra K551 RGB', 'Perifericos', 38990, 15),
(15, 'Audífonos HyperX Cloud III Wireless', 'Perifericos', 125000, 7),
(16, 'Switch Cisco Business 250 Smart 24-Port', 'Redes', 320000, 2),
(17, 'Access Point Ubiquiti UniFi U6 Pro', 'Redes', 175000, 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol_id` int NOT NULL DEFAULT '2',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol_id`) VALUES
(1, 'Nicolás Admin', 'admin@techzone.cl', 'admin123', 1),
(2, 'Juan Cliente', 'juan@correo.cl', 'cliente123', 2),
(3, 'Nicolás Castro', 'n.castro@techzone.cl', 'admin123', 1),
(4, 'Carolina Fuica', 'c.fuica@techzone.cl', 'admin456', 1),
(5, 'Juan Pérez', 'juan.perez@gmail.com', 'cliente123', 2),
(6, 'María José López', 'mj.lopez@outlook.com', 'cliente123', 2),
(7, 'Andrés Silva', 'andres.silva@yahoo.com', 'cliente123', 2),
(8, 'Diego Muñoz', 'dmunoz@empresa.cl', 'cliente123', 2),
(9, 'Valentina Tapia', 'vtapia@unab.cl', 'cliente123', 2),
(10, 'Mónica Cancino', 'monica.cancino@transcomex.cl', 'cliente123', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ventas`
--

DROP TABLE IF EXISTS `ventas`;
CREATE TABLE IF NOT EXISTS `ventas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `total` int NOT NULL DEFAULT '0',
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_venta_cliente` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_ventas`
--
ALTER TABLE `detalle_ventas`
  ADD CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_detalle_venta` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `movimientos_stock`
--
ALTER TABLE `movimientos_stock`
  ADD CONSTRAINT `fk_mov_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `ventas`
--
ALTER TABLE `ventas`
  ADD CONSTRAINT `fk_venta_cliente` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

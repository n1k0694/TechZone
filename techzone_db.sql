-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 28-06-2026 a las 02:23:32
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
-- Estructura de tabla para la tabla `cotizaciones`
--

DROP TABLE IF EXISTS `cotizaciones`;
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

DROP TABLE IF EXISTS `detalle_cotizaciones`;
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

DROP TABLE IF EXISTS `productos`;
CREATE TABLE IF NOT EXISTS `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio` int NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `nombre`, `categoria`, `precio`, `stock`) VALUES
(1, 'Switch Cisco Catalyst 24 Puertos Gigabit', 'Redes', 450000, 8),
(2, 'Router Balanceador de Carga TP-Link Omada ER605', 'Redes', 89900, 12),
(3, 'Access Point Ubiquiti UniFi U6 Plus Wi-Fi 6', 'Redes', 145000, 0),
(4, 'Servidor NAS Synology DiskStation DS224+', 'Almacenamiento', 389000, 4),
(5, 'Tarjeta de Red PCIe 10Gbps ASUS XG-C100C', 'Redes', 110000, 15),
(6, 'Cable de Red Cat6 UTP 305mts Furukawa Azul', 'Redes', 125000, 20),
(7, 'Gabinete Rack Mural 9U Certificado Metálico', 'Infraestructura', 95000, 0),
(8, 'Inyector PoE+ Ubiquiti 30W Gigabit', 'Redes', 24990, 35),
(9, 'Disco Duro Servidor WD Gold 4TB Enterprise SATA', 'Almacenamiento', 185000, 6),
(10, 'Unidad SSD Kingston DC600M 960GB Enterprise', 'Almacenamiento', 135000, 10),
(11, 'Memoria RAM Kingston Server Premier 32GB DDR5 ECC', 'Hardware', 160000, 0),
(12, 'Disco SSD M.2 NVMe WD Black SN850X 1TB', 'Almacenamiento', 95000, 14),
(13, 'Procesador AMD Ryzen 9 7900X 4.7GHz', 'Hardware', 499990, 3),
(14, 'Procesador Intel Xeon Silver 4310 12-Core', 'Hardware', 620000, 2),
(15, 'Memoria RAM Corsair Vengeance 16GB DDR5 5600MHz', 'Hardware', 65000, 25),
(16, 'Fuente de Poder ASUS Prime 750W 80+ Gold APFC', 'Hardware', 105000, 10),
(17, 'Refrigeración Líquida MSI MAG CoreLiquid M240', 'Hardware', 89990, 7),
(18, 'Adaptador USB-C a Ethernet Gigabit Belkin', 'Conectividad', 29990, 40),
(19, 'Kit Teclado y Mouse Inalámbrico Logitech MK270', 'Periféricos', 22990, 17),
(20, 'Monitor Corporativo Dell 24\" IPS FHD HDMI/DP', 'Periféricos', 129900, 4),
(21, 'Router Linksys 1130', 'Redes', 45000, 25);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

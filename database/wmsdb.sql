-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: wmsdb
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `created_at` datetime(6) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `updated_at` datetime(6) DEFAULT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKiwylx6fb2dqdw8kfc31vaiiyp` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('2026-01-19 10:24:12.364609',1,'2026-01-19 10:24:12.364609','DO','Đồ uống',NULL),('2026-01-19 11:10:58.620535',2,'2026-01-19 11:10:58.620535','BK','Bánh kẹo',NULL),('2026-01-19 11:23:03.539028',3,'2026-01-19 11:23:03.539028','DDH','Đồ đóng hộp',NULL);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `is_active` bit(1) DEFAULT NULL,
  `created_by_user_id` bigint DEFAULT NULL,
  `created_date` datetime(6) NOT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `updated_date` datetime(6) DEFAULT NULL,
  `tax_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_type` enum('AGENT','CORPORATE','DISTRIBUTOR','RETAIL','WHOLESALE') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKm3iom37efaxd5eucmxjqqcbe9` (`phone`),
  KEY `FKj996fi8l2xe7lujhtiau9juc5` (`created_by_user_id`),
  CONSTRAINT `FKj996fi8l2xe7lujhtiau9juc5` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (_binary '',NULL,'2026-01-19 08:27:06.000000',4,NULL,NULL,NULL,'Q.1, TP.HCM','vana@gmail.com','Nguyễn Văn A','Khách mua lẻ','0901234567','RETAIL'),(_binary '',NULL,'2026-01-19 08:27:06.000000',5,NULL,NULL,NULL,'Q.7, TP.HCM','thib@gmail.com','Trần Thị B','Đại lý cấp 1','0912345678','AGENT'),(_binary '',NULL,'2026-01-19 08:27:06.000000',6,NULL,'0312345678','Công ty TNHH ABC','KCN Tân Bình, TP.HCM','contact@abc.com','Công ty TNHH ABC','Nhà phân phối chính thức','0283456789','DISTRIBUTOR');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inbound_details`
--

DROP TABLE IF EXISTS `inbound_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inbound_details` (
  `actual_qty` int DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inbound_note_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  `note` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5oamyntvrqi7ec8aac7c9v18f` (`inbound_note_id`),
  KEY `FKbuu6k9ntogx9je5o5n4i1ut6p` (`product_id`),
  CONSTRAINT `FK5oamyntvrqi7ec8aac7c9v18f` FOREIGN KEY (`inbound_note_id`) REFERENCES `inbound_notes` (`id`),
  CONSTRAINT `FKbuu6k9ntogx9je5o5n4i1ut6p` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inbound_details`
--

LOCK TABLES `inbound_details` WRITE;
/*!40000 ALTER TABLE `inbound_details` DISABLE KEYS */;
INSERT INTO `inbound_details` VALUES (100,3,1,1,'Nhập đủ hàng'),(50,4,1,2,'Nhập đủ hàng');
/*!40000 ALTER TABLE `inbound_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inbound_notes`
--

DROP TABLE IF EXISTS `inbound_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inbound_notes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `po_id` bigint DEFAULT NULL,
  `processed_by_user_id` bigint DEFAULT NULL,
  `received_date` datetime(6) DEFAULT NULL,
  `note_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_signature` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('CANCELLED','COMPLETED','DRAFT','VERIFYING') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKa4isrbvk45trfmmmyfrwcdpe9` (`note_number`),
  KEY `FK6d0vwx5q7p65tkrt2tm59kppk` (`processed_by_user_id`),
  KEY `FKgx46mmueaqbk4dxysvyi9yv3y` (`po_id`),
  CONSTRAINT `FK6d0vwx5q7p65tkrt2tm59kppk` FOREIGN KEY (`processed_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKgx46mmueaqbk4dxysvyi9yv3y` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inbound_notes`
--

LOCK TABLES `inbound_notes` WRITE;
/*!40000 ALTER TABLE `inbound_notes` DISABLE KEYS */;
INSERT INTO `inbound_notes` VALUES (1,1,3,'2026-01-19 15:07:12.543759','IBN-1768809621553',NULL,'COMPLETED');
/*!40000 ALTER TABLE `inbound_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `expiry_date` date DEFAULT NULL,
  `manufacture_date` date DEFAULT NULL,
  `quantity` int NOT NULL,
  `quantity_allocated` int DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `location_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inventory_product_location` (`product_id`,`location_id`),
  KEY `FKrc6v5i9vyfech3d0r4l11yf2a` (`location_id`),
  CONSTRAINT `FKq2yge7ebtfuvwufr6lwfwqy9l` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `FKrc6v5i9vyfech3d0r4l11yf2a` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
INSERT INTO `inventory` VALUES ('2027-01-19',NULL,50,NULL,5,1,2),('2027-01-19',NULL,50,NULL,6,3,1),('2027-01-19',NULL,50,NULL,7,8,1);
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `quantity_after` int NOT NULL,
  `quantity_before` int NOT NULL,
  `quantity_changed` int NOT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `location_id` bigint DEFAULT NULL,
  `performed_by_user_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  `timestamp` datetime(6) DEFAULT NULL,
  `reference_doc_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('INBOUND_RECEIVE','INBOUND_STAGE','INTERNAL_PICK','OUTBOUND_PICK','OUTBOUND_SHIP','PUT_AWAY','STOCKTAKE_ADJUST') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKqpwf3xpyd3s4o8uhwdbwc7yo0` (`location_id`),
  KEY `FKi0kleg9sap0sfxbptyaao77ro` (`performed_by_user_id`),
  KEY `FKrm9aaxuvvmp9ehvxwe936ar04` (`product_id`),
  CONSTRAINT `FKi0kleg9sap0sfxbptyaao77ro` FOREIGN KEY (`performed_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKqpwf3xpyd3s4o8uhwdbwc7yo0` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `FKrm9aaxuvvmp9ehvxwe936ar04` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
INSERT INTO `inventory_transactions` VALUES (100,0,100,1,2,3,1,'2026-01-19 15:07:12.603163',NULL,'INBOUND_STAGE'),(50,0,50,2,2,3,2,'2026-01-19 15:07:12.630433',NULL,'INBOUND_STAGE'),(50,0,50,3,11,3,2,'2026-01-19 15:12:40.249597',NULL,'INTERNAL_PICK'),(100,0,100,4,11,3,1,'2026-01-19 15:12:40.349265',NULL,'INTERNAL_PICK'),(50,0,50,5,1,3,2,'2026-01-19 15:13:04.953104',NULL,'PUT_AWAY'),(50,0,50,6,3,3,1,'2026-01-19 15:13:35.147119',NULL,'PUT_AWAY'),(50,0,50,7,8,3,1,'2026-01-19 15:13:51.251693',NULL,'PUT_AWAY');
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_details`
--

DROP TABLE IF EXISTS `invoice_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_details` (
  `quantity` int DEFAULT NULL,
  `total_line_amount` decimal(38,2) DEFAULT NULL,
  `unit_price` decimal(38,2) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `invoice_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK439lfpbc6j1k0cn26wtp8f96r` (`invoice_id`),
  KEY `FKchhydd0d280ruig3hmars76wa` (`product_id`),
  CONSTRAINT `FK439lfpbc6j1k0cn26wtp8f96r` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `FKchhydd0d280ruig3hmars76wa` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_details`
--

LOCK TABLES `invoice_details` WRITE;
/*!40000 ALTER TABLE `invoice_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `final_amount` decimal(38,2) DEFAULT NULL,
  `tax_amount` decimal(38,2) DEFAULT NULL,
  `total_amount` decimal(38,2) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `created_by_user_id` bigint DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  `due_date` datetime(6) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `outbound_note_id` bigint NOT NULL,
  `invoice_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('CANCELLED','OVERDUE','PAID','UNPAID') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK8iq56w9yay9h2voo1yjgqh825` (`outbound_note_id`),
  UNIQUE KEY `UKl1x55mfsay7co0r3m9ynvipd5` (`invoice_number`),
  KEY `FKfjkha4bd3ckx2ru4xnvneom4n` (`created_by_user_id`),
  KEY `FKq2w4hmh6l9othnp6cepp0cfe2` (`customer_id`),
  CONSTRAINT `FK5wkal28ptbtq8c5j49tn2l4d0` FOREIGN KEY (`outbound_note_id`) REFERENCES `outbound_notes` (`id`),
  CONSTRAINT `FKfjkha4bd3ckx2ru4xnvneom4n` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKq2w4hmh6l9othnp6cepp0cfe2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `is_full` bit(1) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('SHELF_STORAGE','STAGE_LOC','TRANSIT') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKnjcw38t3qcy312pglqpf3pd59` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (_binary '\0',1,'A-01-01','SHELF_STORAGE'),(NULL,2,'STAGE','STAGE_LOC'),(_binary '\0',3,'A-01-02','SHELF_STORAGE'),(_binary '\0',4,'B-01-01','SHELF_STORAGE'),(_binary '\0',5,'C-01-01','SHELF_STORAGE'),(_binary '\0',6,'C-02-01','SHELF_STORAGE'),(_binary '\0',7,'ZZ-01-01','SHELF_STORAGE'),(_binary '\0',8,'A-02-01','SHELF_STORAGE'),(_binary '\0',9,'A-02-02','SHELF_STORAGE'),(_binary '\0',10,'B-01-02','SHELF_STORAGE'),(_binary '\0',11,'TRANSIT_3','TRANSIT');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outbound_details`
--

DROP TABLE IF EXISTS `outbound_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outbound_details` (
  `allocated_qty` int DEFAULT NULL,
  `requested_qty` int DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `outbound_order_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKnnior6w6jbmdaiwqaslb6lf7p` (`outbound_order_id`),
  KEY `FKsxx5itqn5ci1dmnodfoo6ktg3` (`product_id`),
  CONSTRAINT `FKnnior6w6jbmdaiwqaslb6lf7p` FOREIGN KEY (`outbound_order_id`) REFERENCES `outbound_orders` (`id`),
  CONSTRAINT `FKsxx5itqn5ci1dmnodfoo6ktg3` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outbound_details`
--

LOCK TABLES `outbound_details` WRITE;
/*!40000 ALTER TABLE `outbound_details` DISABLE KEYS */;
INSERT INTO `outbound_details` VALUES (0,12,1,1,1),(0,13,2,1,2);
/*!40000 ALTER TABLE `outbound_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outbound_note_details`
--

DROP TABLE IF EXISTS `outbound_note_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outbound_note_details` (
  `quantity` int DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `outbound_note_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  `source_location_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKtbxhx47ea9wvc05mcplb1ldl6` (`outbound_note_id`),
  KEY `FK5weabfntm5pl5hphlapg1didk` (`product_id`),
  KEY `FKlnn6ub00a456i4tknlk4y41ao` (`source_location_id`),
  CONSTRAINT `FK5weabfntm5pl5hphlapg1didk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `FKlnn6ub00a456i4tknlk4y41ao` FOREIGN KEY (`source_location_id`) REFERENCES `locations` (`id`),
  CONSTRAINT `FKtbxhx47ea9wvc05mcplb1ldl6` FOREIGN KEY (`outbound_note_id`) REFERENCES `outbound_notes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outbound_note_details`
--

LOCK TABLES `outbound_note_details` WRITE;
/*!40000 ALTER TABLE `outbound_note_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `outbound_note_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outbound_notes`
--

DROP TABLE IF EXISTS `outbound_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outbound_notes` (
  `created_at` datetime(6) DEFAULT NULL,
  `created_by_user_id` bigint DEFAULT NULL,
  `exported_date` datetime(6) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `outbound_order_id` bigint NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('CANCELLED','COMPLETED','DRAFT','PACKED') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKe6r9ifml92hpyodlonp72p6dx` (`code`),
  KEY `FKkbbeh3apftssoh8hveykiyjoj` (`created_by_user_id`),
  KEY `FKa4u81b63lb7q335p5yi1tx8r4` (`outbound_order_id`),
  CONSTRAINT `FKa4u81b63lb7q335p5yi1tx8r4` FOREIGN KEY (`outbound_order_id`) REFERENCES `outbound_orders` (`id`),
  CONSTRAINT `FKkbbeh3apftssoh8hveykiyjoj` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outbound_notes`
--

LOCK TABLES `outbound_notes` WRITE;
/*!40000 ALTER TABLE `outbound_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `outbound_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outbound_orders`
--

DROP TABLE IF EXISTS `outbound_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outbound_orders` (
  `created_by_user_id` bigint DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `picker_user_id` bigint DEFAULT NULL,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ALLOCATED','CANCELLED','COMPLETED','NEW','PACKED','PICKING','SHIPPED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKsvr0qyk5e62lr8pmhrevybjyp` (`order_number`),
  KEY `FKc12vw7gi47c083ouwxn9t32w6` (`picker_user_id`),
  KEY `FK82ae7bu9h4a05ph882epefgk9` (`created_by_user_id`),
  KEY `FKadg694lfd2k3gdsf71vggmvq4` (`customer_id`),
  CONSTRAINT `FK82ae7bu9h4a05ph882epefgk9` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKadg694lfd2k3gdsf71vggmvq4` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `FKc12vw7gi47c083ouwxn9t32w6` FOREIGN KEY (`picker_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outbound_orders`
--

LOCK TABLES `outbound_orders` WRITE;
/*!40000 ALTER TABLE `outbound_orders` DISABLE KEYS */;
INSERT INTO `outbound_orders` VALUES (2,'2026-01-19 15:28:49.243791',4,1,NULL,'OUT2026011900001','Q.1, TP.HCM','Nguyễn Văn A','0901234567','NEW');
/*!40000 ALTER TABLE `outbound_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `po_details`
--

DROP TABLE IF EXISTS `po_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `po_details` (
  `expected_qty` int DEFAULT NULL,
  `unit_price` decimal(38,2) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `po_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKr14tpp3gsa82xctuy8m2c30df` (`product_id`),
  KEY `FKp8qeliphhmk8vmq9i1pb8ukf0` (`po_id`),
  CONSTRAINT `FKp8qeliphhmk8vmq9i1pb8ukf0` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`),
  CONSTRAINT `FKr14tpp3gsa82xctuy8m2c30df` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `po_details`
--

LOCK TABLES `po_details` WRITE;
/*!40000 ALTER TABLE `po_details` DISABLE KEYS */;
INSERT INTO `po_details` VALUES (100,NULL,1,1,1),(50,NULL,2,1,2);
/*!40000 ALTER TABLE `po_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `price` decimal(15,2) DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKfhmd06dsmj6k0n90swsh8ie9g` (`sku`),
  UNIQUE KEY `UKqfr8vf85k3q1xinifvsl1eynf` (`barcode`),
  KEY `FKog2rp4qthbtt2lfyhfo32lsw9` (`category_id`),
  CONSTRAINT `FKog2rp4qthbtt2lfyhfo32lsw9` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (184000.00,1,1,'Thùng','8935049501503','DO1','https://storage.googleapis.com/sc_pcm_product/prod/2025/1/2/616076-28935049502245_3.webp','nước ngọt Coca Cola 320ml'),(195000.00,1,2,'Thùng','8934588022111','DO2','https://cdn.tgdd.vn/Products/Images/2443/79129/bhx/thung-24-lon-nuoc-ngot-7-up-vi-chanh-320ml-202312252116245308.jpg','nước ngọt 7 Up vị chanh 320ml'),(395000.00,1,3,'Thùng','8934673581394','DO3','https://bizweb.dktcdn.net/100/514/431/products/thung-12-hop-sua-tuoi-it-duong-vinamilk-100-sua-tuoi-1-lit-202404021115345054.jpg?v=1726282244873','Sữa tươi tiệt trùng ít đường Vinamilk 100% Sữa tươi 1 lít'),(288000.00,2,4,'Thùng','8936036026177','BK1','https://cf.shopee.vn/file/a459bd22591b4dbf84b8a8e2c1d1c85a','Bánh Gạo Nướng Orion An Vị Tự Nhiên 151g'),(125000.00,2,5,'Thùng','8935001713128','BK2','https://cdnv2.tgdd.vn/bhx-static/bhx/Products/Images/7199/205809/bhx/keo-deo-huong-trai-cay-tong-hop-panda-bears-chupa-chups-goi-90g_202504241453240547.jpg','Kẹo dẻo trái cây Chupa Chups 90g'),(70000.00,3,6,'Lốc','8934572002006','DDH1','https://cdn.tgdd.vn/Products/Images/3238/196931/bhx/heo-hai-lat-3-bong-mai-vissan-hop-150g-201907291356285492.jpg','Heo hai lát 3 Bông Mai Vissan 150g'),(170000.00,3,7,'Thùng ','8938501141019','DDH2','https://filebroker-cdn.lazada.vn/kf/S4dcd3b70e90e4c65aa28bb2a759f33e4Y.jpg_340x340q80.jpg','Cá mòi xốt cà đậm đà 3 Cô Gái 155g');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `created_at` datetime(6) DEFAULT NULL,
  `created_by_user_id` bigint DEFAULT NULL,
  `expected_date` datetime(6) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `supplier_id` bigint DEFAULT NULL,
  `po_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('APPROVED','CANCELLED','COMPLETED','NEW','RECEIVING') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKpbiykvcpyg0jslne4gviyeuc2` (`po_number`),
  KEY `FKsnldca8ivox9hh7rk4musap97` (`created_by_user_id`),
  KEY `FKrpdasmb8y8xs5tiy4369xpinq` (`supplier_id`),
  CONSTRAINT `FKrpdasmb8y8xs5tiy4369xpinq` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `FKsnldca8ivox9hh7rk4musap97` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES ('2026-01-19 14:59:23.591608',2,NULL,1,1,'PO-1768809563591','COMPLETED');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stocktake_details`
--

DROP TABLE IF EXISTS `stocktake_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocktake_details` (
  `actual_counted_qty` int DEFAULT NULL,
  `system_qty_snapshot` int DEFAULT NULL,
  `assignment_id` bigint DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `location_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  `session_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK24rae0jtmw1coxc4wmkm8yhcn` (`assignment_id`),
  KEY `FKox3p3ewwk58d0w8goaur9h11y` (`location_id`),
  KEY `FKfa95ukbdaww1dbjy5iome6rfa` (`product_id`),
  KEY `FKoohp1xam1n8bkvv4dd5pdxdr2` (`session_id`),
  CONSTRAINT `FK24rae0jtmw1coxc4wmkm8yhcn` FOREIGN KEY (`assignment_id`) REFERENCES `stocktake_shelf_assignments` (`id`),
  CONSTRAINT `FKfa95ukbdaww1dbjy5iome6rfa` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `FKoohp1xam1n8bkvv4dd5pdxdr2` FOREIGN KEY (`session_id`) REFERENCES `stocktake_sessions` (`id`),
  CONSTRAINT `FKox3p3ewwk58d0w8goaur9h11y` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocktake_details`
--

LOCK TABLES `stocktake_details` WRITE;
/*!40000 ALTER TABLE `stocktake_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `stocktake_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stocktake_sessions`
--

DROP TABLE IF EXISTS `stocktake_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocktake_sessions` (
  `completed_at` datetime(6) DEFAULT NULL,
  `created_by_user_id` bigint DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `started_at` datetime(6) DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zone_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ADJUSTED','COMPLETED','DRAFT','IN_PROGRESS') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK2jvbx61iclelr90sv45v4cvpy` (`code`),
  KEY `FK1ru2dpv3rxtbkvxpuoo9mui3y` (`created_by_user_id`),
  CONSTRAINT `FK1ru2dpv3rxtbkvxpuoo9mui3y` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocktake_sessions`
--

LOCK TABLES `stocktake_sessions` WRITE;
/*!40000 ALTER TABLE `stocktake_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `stocktake_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stocktake_shelf_assignments`
--

DROP TABLE IF EXISTS `stocktake_shelf_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stocktake_shelf_assignments` (
  `completed_at` datetime(6) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `location_id` bigint DEFAULT NULL,
  `session_id` bigint DEFAULT NULL,
  `staff_id` bigint DEFAULT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `status` enum('COMPLETED','IN_PROGRESS','OPEN') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKrjbpq9jfqig6ukx8mowll9cdh` (`location_id`),
  KEY `FKny5dssap1qfl3mkohq9buq5hs` (`session_id`),
  KEY `FK26uce2pm20jf5swoms8mvx8se` (`staff_id`),
  CONSTRAINT `FK26uce2pm20jf5swoms8mvx8se` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKny5dssap1qfl3mkohq9buq5hs` FOREIGN KEY (`session_id`) REFERENCES `stocktake_sessions` (`id`),
  CONSTRAINT `FKrjbpq9jfqig6ukx8mowll9cdh` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stocktake_shelf_assignments`
--

LOCK TABLES `stocktake_shelf_assignments` WRITE;
/*!40000 ALTER TABLE `stocktake_shelf_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `stocktake_shelf_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_invoice_details`
--

DROP TABLE IF EXISTS `supplier_invoice_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_invoice_details` (
  `quantity` int DEFAULT NULL,
  `total_line_amount` decimal(38,2) DEFAULT NULL,
  `unit_price` decimal(38,2) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint DEFAULT NULL,
  `supplier_invoice_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK6519lesjt6gg8xpo8f5yalxke` (`product_id`),
  KEY `FKg2tiicqtxrtalkwptyqvdtdp6` (`supplier_invoice_id`),
  CONSTRAINT `FK6519lesjt6gg8xpo8f5yalxke` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `FKg2tiicqtxrtalkwptyqvdtdp6` FOREIGN KEY (`supplier_invoice_id`) REFERENCES `supplier_invoices` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_invoice_details`
--

LOCK TABLES `supplier_invoice_details` WRITE;
/*!40000 ALTER TABLE `supplier_invoice_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_invoice_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_invoices`
--

DROP TABLE IF EXISTS `supplier_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_invoices` (
  `final_amount` decimal(38,2) DEFAULT NULL,
  `tax_amount` decimal(38,2) DEFAULT NULL,
  `total_amount` decimal(38,2) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `created_by_user_id` bigint DEFAULT NULL,
  `due_date` datetime(6) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inbound_note_id` bigint NOT NULL,
  `supplier_id` bigint NOT NULL,
  `invoice_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('CANCELLED','OVERDUE','PAID','UNPAID') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKeaj8xcwyeun2ek87e7bjus8vw` (`inbound_note_id`),
  UNIQUE KEY `UK14p93m5j08m8k1xjnn5raxhmh` (`invoice_number`),
  KEY `FKoau212uhavs033rsfamey1oxc` (`created_by_user_id`),
  KEY `FKma3hfc5lf1sxhtitnxmylraps` (`supplier_id`),
  CONSTRAINT `FKbbr5am5600h0yxjh8ivs2se4t` FOREIGN KEY (`inbound_note_id`) REFERENCES `inbound_notes` (`id`),
  CONSTRAINT `FKma3hfc5lf1sxhtitnxmylraps` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `FKoau212uhavs033rsfamey1oxc` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_invoices`
--

LOCK TABLES `supplier_invoices` WRITE;
/*!40000 ALTER TABLE `supplier_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `supplier_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKqldh0sxdeioes5lbcxr6s9ld0` (`phone`),
  UNIQUE KEY `UKq5uvp89ra4ksaty5ghyaw4kjr` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'1900555584','anhthan@coca-cola.com','Công ty Coca-Cola ','Xa lộ Hà Nội, Phường Linh Trung, Quận Thủ Đức, Thành phố Hồ Chí Minh, Việt Nam'),(2,'0300588569','vinamilk@gmail.com','Vinamilk','Số 64 Dương Quang Đông, P. Chánh Hưng, TP. Hồ Chí Minh (địa chỉ cũ: Số 64 Dương Quang Đông, P.5, Q. 8, TP. Hồ Chí Minh)'),(3,'02862870000 ','thaicorp@tcivn.com','CÔNG TY TNHH THAI CORP INTERNATIONAL','Lô 5-4, đường M14, Khu công nghiệp Tân Bình mở rộng,\nP Bình Hưng Hoà, Q Bình Tân, Tp Hồ Chí Minh.'),(4,'02835123123','CSKH_Orion@orionworld.com','Công ty TNHH Thực phẩm Orion Vina','Tầng 22, toà nhà Pearl Plaza, 561A Điện Biên Phủ, Phường 25, Bình Thạnh, Thành phố Hồ Chí Minh');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_config`
--

DROP TABLE IF EXISTS `system_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `updated_at` datetime(6) DEFAULT NULL,
  `updated_by_user_id` bigint DEFAULT NULL,
  `picking_algorithm` enum('FEFO','FIFO') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKhwvhxtobf80mss0adq9d2ucv8` (`updated_by_user_id`),
  CONSTRAINT `FKhwvhxtobf80mss0adq9d2ucv8` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_config`
--

LOCK TABLES `system_config` WRITE;
/*!40000 ALTER TABLE `system_config` DISABLE KEYS */;
INSERT INTO `system_config` VALUES (1,'2026-01-19 15:20:45.668540',1,'FIFO');
/*!40000 ALTER TABLE `system_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `is_active` bit(1) DEFAULT NULL,
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ACCOUNTANT','ADMIN','MANAGER','NONE','STAFF') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`),
  UNIQUE KEY `UK9q63snka3mdh91as4io72espi` (`phone_number`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (_binary '',1,'admin','System Admin','$2a$10$bWwOHzScL6X.1bwi7dSjneLUhfmkjPZkZiNOe.vZ.AnLmkjx2vAMu','0399329361','ADMIN'),(_binary '',2,'manager','System Manager','$2a$10$/rmrhIePzwDMPJRjHer3MO0lEf4KpSkXZNoCDRBUgE6e9UHl9Y0bu','0394374771','MANAGER'),(_binary '',3,'staff','System Staff','$2a$10$7hLBaX2oJYwGVpNHXbHSZO0SXgZ0jm2WPYZVKsvUYSOvCpG5M1POa','165165','STAFF'),(_binary '',4,'accountant','System Accountant','$2a$10$LgKLBvxId8JvCclTT4zuvuAI451CKYYd7wkTh2Rcl8zvXmICs/cCa','0900000011','ACCOUNTANT');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-19 15:35:16

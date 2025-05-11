-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: school_exchange
-- ------------------------------------------------------
-- Server version	8.0.41

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
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int NOT NULL,
  `old_value` text,
  `new_value` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'create','post',1,NULL,'{\"title\":\"Sách Giải tích\",\"status\":\"pending\"}','2025-05-10 01:27:19'),(2,1,'update','post',1,'{\"status\":\"pending\"}','{\"status\":\"approved\"}','2025-05-10 01:27:19'),(3,1,'create','activity',1,NULL,'{\"title\":\"Hội chợ trao đổi sách\",\"status\":\"pending\"}','2025-05-10 01:27:19'),(4,2,'update','activity',1,'{\"status\":\"pending\"}','{\"status\":\"approved\"}','2025-05-10 01:27:19'),(5,1,'create','user',4,NULL,'{\"username\":\"hocsinh1\",\"status\":\"active\"}','2025-05-10 01:27:19'),(6,1,'update','post',13,'{\"status\":\"pending\"}','{\"status\":\"approved\"}','2025-05-11 06:48:50'),(7,1,'update','post',16,'{\"status\":\"pending\"}','{\"status\":\"approved\"}','2025-05-11 06:49:05'),(8,1,'update','post',22,'{\"status\":\"pending\"}','{\"status\":\"approved\"}','2025-05-11 06:49:09'),(9,1,'update','post',20,'{\"status\":\"pending\"}','{\"status\":\"approved\"}','2025-05-11 06:49:13'),(10,4,'update','post',9,'{\"price\":\"80000.00\",\"status\":\"rejected\"}','{\"price\":\"0\",\"status\":\"pending\"}','2025-05-11 08:36:22'),(11,1,'create','activity',6,NULL,'{\"title\":\"a\",\"description\":\"b\",\"start_date\":\"2025-05-11 08:43:00\",\"end_date\":\"2025-05-11 12:43:00\",\"location\":\"c\",\"name_organizer\":\"d\",\"guidelines\":\"\",\"status\":\"approved\",\"items\":[]}','2025-05-11 08:43:41'),(12,1,'update','activity',6,'{\"id\":6,\"title\":\"a\",\"description\":\"b\",\"start_date\":\"2025-05-11T01:43:00.000Z\",\"end_date\":\"2025-05-11T05:43:00.000Z\",\"location\":\"c\",\"organizer_id\":1,\"name_organizer\":\"d\",\"guidelines\":\"\",\"status\":\"approved\",\"created_at\":\"2025-05-11T08:43:41.000Z\",\"updated_at\":\"2025-05-11T08:43:41.000Z\",\"items\":[]}','{\"title\":\"a\",\"description\":\"bc\",\"start_date\":\"2025-05-11T01:43\",\"end_date\":\"2025-05-11T05:43\",\"location\":\"c\",\"name_organizer\":\"d\",\"guidelines\":\"\",\"status\":\"approved\",\"items\":[]}','2025-05-11 08:50:02'),(13,1,'delete','activity',6,'{\"id\":6,\"title\":\"a\",\"description\":\"bc\",\"start_date\":\"2025-05-10T18:43:00.000Z\",\"end_date\":\"2025-05-10T22:43:00.000Z\",\"location\":\"c\",\"organizer_id\":1,\"name_organizer\":\"d\",\"guidelines\":\"\",\"status\":\"approved\",\"created_at\":\"2025-05-11T08:43:41.000Z\",\"updated_at\":\"2025-05-11T08:50:02.000Z\",\"items\":[]}',NULL,'2025-05-11 08:50:28'),(14,1,'create','activity',7,NULL,'{\"title\":\"test thông báo\",\"description\":\"1\",\"start_date\":\"2025-05-10 08:50:00\",\"end_date\":\"2025-05-11 08:50:00\",\"location\":\"1\",\"name_organizer\":\"2\",\"guidelines\":\"\",\"status\":\"approved\",\"items\":[]}','2025-05-11 08:50:47'),(15,1,'update','activity_item',1,'{\"id\":1,\"activity_id\":1,\"name\":\"Bàn gấp\",\"description\":\"Bàn để trưng bày sách\",\"quantity_needed\":10,\"quantity_received\":5,\"created_at\":\"2025-05-10T01:27:19.000Z\"}','{\"id\":1,\"activity_id\":1,\"name\":\"Bàn gấp\",\"description\":\"Bàn để trưng bày sách\",\"quantity_needed\":10,\"quantity_received\":9,\"created_at\":\"2025-05-10T01:27:19.000Z\"}','2025-05-11 08:51:30'),(16,1,'update','activity',7,'{\"id\":7,\"title\":\"test thông báo\",\"description\":\"1\",\"start_date\":\"2025-05-10T01:50:00.000Z\",\"end_date\":\"2025-05-11T01:50:00.000Z\",\"location\":\"1\",\"organizer_id\":1,\"name_organizer\":\"2\",\"guidelines\":\"\",\"status\":\"approved\",\"created_at\":\"2025-05-11T08:50:47.000Z\",\"updated_at\":\"2025-05-11T08:50:47.000Z\",\"items\":[]}','{\"title\":\"test thông báo\",\"description\":\"1\",\"start_date\":\"2025-05-10T01:50\",\"end_date\":\"2025-05-11T01:50\",\"location\":\"1\",\"name_organizer\":\"2\",\"guidelines\":\"\",\"status\":\"approved\",\"items\":[{\"name\":\"a\",\"quantity_needed\":3,\"description\":\"c\",\"quantity_received\":0}]}','2025-05-11 09:07:50'),(17,1,'update','post',9,'{\"status\":\"pending\",\"rejection_reason\":\"sai anh\"}','{\"status\":\"rejected\",\"rejection_reason\":\"sai ảnh\"}','2025-05-11 09:08:38'),(18,1,'update','post',9,'{\"price\":\"0.00\",\"status\":\"rejected\"}','{\"price\":\"0\",\"status\":\"approved\"}','2025-05-11 09:22:59'),(19,1,'delete','activity',7,'{\"id\":7,\"title\":\"test thông báo\",\"description\":\"1\",\"start_date\":\"2025-05-09T18:50:00.000Z\",\"end_date\":\"2025-05-10T18:50:00.000Z\",\"location\":\"1\",\"organizer_id\":1,\"name_organizer\":\"2\",\"guidelines\":\"\",\"status\":\"approved\",\"created_at\":\"2025-05-11T08:50:47.000Z\",\"updated_at\":\"2025-05-11T09:07:50.000Z\",\"items\":[{\"id\":8,\"activity_id\":7,\"name\":\"a\",\"description\":\"c\",\"quantity_needed\":3,\"quantity_received\":0,\"created_at\":\"2025-05-11T09:07:50.000Z\"}]}',NULL,'2025-05-11 09:23:26'),(20,1,'update','user',1,'{\"role_id\":1}','{\"role_id\":\"1\"}','2025-05-11 09:32:59'),(21,1,'update','user',1,'{\"full_name\":\"Nguyễn Văn Admin\",\"role_id\":1}','{\"full_name\":\"Lê Hoàng Linh\",\"role_id\":\"1\"}','2025-05-11 09:33:13'),(22,1,'update','activity_item',1,'{\"id\":1,\"activity_id\":1,\"name\":\"Bàn gấp\",\"description\":\"Bàn để trưng bày sách\",\"quantity_needed\":10,\"quantity_received\":9,\"created_at\":\"2025-05-10T01:27:19.000Z\"}','{\"id\":1,\"activity_id\":1,\"name\":\"Bàn gấp\",\"description\":\"Bàn để trưng bày sách\",\"quantity_needed\":10,\"quantity_received\":10,\"created_at\":\"2025-05-10T01:27:19.000Z\"}','2025-05-11 09:54:58'),(23,1,'update','user',3,'{\"role_id\":2}','{\"role_id\":\"2\"}','2025-05-11 11:19:02'),(24,1,'update','post',15,'{\"status\":\"pending\"}','{\"status\":\"approved\"}','2025-05-11 13:22:55'),(25,1,'update','post',25,'{\"price\":\"200000.00\",\"status\":\"approved\"}','{\"price\":\"200000\",\"status\":\"rejected\"}','2025-05-11 13:24:54'),(26,4,'create','post',26,NULL,'{\"title\":\"Áo đồng phục size M\",\"description\":\"ABC\",\"price\":\"0\",\"category\":\"3\",\"location\":\"Trường THPT Nguyễn Du\",\"status\":\"pending\"}','2025-05-11 13:27:23'),(27,1,'update','post',26,'{\"status\":\"pending\"}','{\"status\":\"approved\"}','2025-05-11 13:27:36');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-11 20:29:09

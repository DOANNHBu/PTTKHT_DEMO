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
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(15,2) DEFAULT NULL,
  `category_id` int NOT NULL,
  `location` varchar(100) NOT NULL,
  `author_id` int NOT NULL,
  `status` enum('pending','approved','rejected','deleted') DEFAULT 'pending',
  `rejection_reason` text,
  `availability` enum('available','sold') DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status_update_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,'Sách Giải tích','Sách Giải tích lớp 12, đã sử dụng nhẹ với một số ghi chú nhỏ',250000.00,1,'Trường THPT Nguyễn Du',4,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:00:50',NULL),(2,'Sách hướng dẫn thí nghiệm Hóa học','Sách hướng dẫn thí nghiệm Hóa học lớp 11, chưa sử dụng',150000.00,1,'Trường THPT Chu Văn An',6,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:09:54',NULL),(3,'Bộ sách Văn học','Bộ 5 cuốn sách văn học kinh điển cần thiết cho lớp Văn',300000.00,1,'Trường THPT Việt Đức',8,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:09:57',NULL),(4,'Sách Vật lý cho Sinh viên và Kỹ sư','Sách Vật lý đại học trong tình trạng tuyệt vời',350000.00,1,'Trường THPT Phan Đình Phùng',9,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:08:28',NULL),(5,'Máy tính bỏ túi đồ họa','Máy tính Casio fx-580 hoạt động hoàn hảo',450000.00,2,'Trường THPT Nguyễn Du',5,'approved',NULL,'sold','2025-05-10 01:27:19','2025-05-10 08:04:46',NULL),(6,'USB 64GB','USB mới chưa sử dụng',120000.00,2,'Trường THPT Chu Văn An',7,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:09:50',NULL),(7,'Chuột không dây','Chuột không dây Logitech, đã sử dụng nhẹ',100000.00,2,'Trường THPT Lê Quý Đôn',10,'approved',NULL,'sold','2025-05-10 01:27:19','2025-05-10 08:08:03',NULL),(8,'Đế tản nhiệt laptop','Đế tản nhiệt cho laptop đến 17 inch',150000.00,2,'Trường THPT Việt Đức',8,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 09:23:00','2025-05-10 09:23:00'),(9,'Áo đồng phục size M','Áo đồng phục màu xanh size M, mặc một lần',0.00,3,'Trường THPT Nguyễn Du',4,'approved','sai ảnh','available','2025-05-10 01:27:19','2025-05-11 09:22:59','2025-05-11 09:22:59'),(10,'Áo đội tuyển thể thao size L','Áo đội tuyển trường size L, tình trạng tốt',120000.00,3,'Trường THPT Chu Văn An',6,'approved',NULL,'sold','2025-05-10 01:27:19','2025-05-10 09:55:35','2025-05-10 09:30:53'),(11,'Áo khoác đồng phục mùa đông','Áo khoác đồng phục mùa đông size S, như mới',250000.00,3,'Trường THPT Nguyễn Du',4,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:09:42',NULL),(12,'Bóng rổ','Bóng rổ kích thước tiêu chuẩn, đã sử dụng nhẹ',150000.00,4,'Trường THPT Phan Đình Phùng',9,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:04:49',NULL),(13,'Bộ văn phòng phẩm','Bộ văn phòng phẩm đầy đủ với bút, bút dạ quang và giấy note',100000.00,5,'Trường THPT Lê Quý Đôn',10,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-11 06:48:50','2025-05-11 06:48:50'),(14,'Giày đá bóng size 42','Giày đá bóng Adidas size 42, sử dụng một mùa',200000.00,4,'Trường THPT Nguyễn Du',5,'approved',NULL,'sold','2025-05-10 01:27:19','2025-05-10 08:07:44',NULL),(15,'Máy tính khoa học','Máy tính khoa học cơ bản, hoạt động tốt',50000.00,5,'Trường THPT Chu Văn An',7,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-11 13:22:55','2025-05-11 13:22:55'),(16,'Đàn organ điện tử','Đàn organ 61 phím với chân đế',750000.00,6,'Trường THPT Việt Đức',8,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-11 06:49:05','2025-05-11 06:49:05'),(17,'Bộ vở','5 quyển vở mới, kiểu ô ly',70000.00,5,'Trường THPT Phan Đình Phùng',9,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:09:10',NULL),(18,'Bộ văn phòng phẩm','Bộ văn phòng phẩm đầy đủ với bút, bút dạ quang và giấy note',100000.00,5,'Trường THPT Lê Quý Đôn',10,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:09:33',NULL),(19,'Đàn guitar acoustic','Đàn guitar cho người mới bắt đầu kèm hộp đựng và pick',650000.00,6,'Trường THPT Nguyễn Du',5,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:07:47',NULL),(20,'Sáo','Sáo trúc dành cho học sinh, tình trạng tốt',500000.00,6,'Trường THPT Chu Văn An',6,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-11 06:49:13','2025-05-11 06:49:13'),(21,'Đàn organ điện tử','Đàn organ 61 phím với chân đế',750000.00,6,'Trường THPT Việt Đức',8,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:07:50',NULL),(22,'Balo','Balo màu đen hiệu Sakos, đã sử dụng nhẹ',200000.00,7,'Trường THPT Phan Đình Phùng',9,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-11 06:49:09','2025-05-11 06:49:09'),(23,'Hộp cơm giữ nhiệt','Hộp cơm giữ nhiệt, như mới',80000.00,7,'Trường THPT Lê Quý Đôn',10,'approved',NULL,'available','2025-05-10 01:27:19','2025-05-10 08:07:56',NULL),(24,'Dụng cụ sắp xếp tủ đựng đồ','Dụng cụ sắp xếp tủ đựng đồ có gương',120000.00,7,'Trường THPT Nguyễn Du',4,'approved',NULL,'sold','2025-05-10 01:27:19','2025-05-10 08:51:01',NULL),(25,'Quả bóng đá mới ','Bóng động lực size 5',200000.00,4,'UET',4,'rejected',NULL,'sold','2025-05-10 08:44:15','2025-05-11 13:24:54','2025-05-11 13:24:54'),(26,'Áo đồng phục size M','ABC',0.00,3,'Trường THPT Nguyễn Du',4,'approved',NULL,'available','2025-05-11 13:27:23','2025-05-11 13:27:36','2025-05-11 13:27:36');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
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

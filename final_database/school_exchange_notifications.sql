-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: school_exchange
-- ------------------------------------------------------
-- Server version	8.0.34

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
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('post_approval','activity_update','system') NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,4,'Bài đăng được chấp nhận','Bài đăng \"Sách Giải tích\" của bạn đã được chấp nhận','post_approval',1,'2025-05-10 01:27:19'),(2,5,'Bài đăng được chấp nhận','Bài đăng \"Máy tính bỏ túi đồ họa\" của bạn đã được chấp nhận','post_approval',1,'2025-05-10 01:27:19'),(3,6,'Cập nhật hoạt động','Hoạt động \"Hội chợ trao đổi sách\" đã được cập nhật','activity_update',0,'2025-05-10 01:27:19'),(4,7,'Thông báo hệ thống','Chào mừng đến với Nền tảng Trao đổi Học đường','system',1,'2025-05-10 01:27:19'),(5,8,'Bài đăng đang chờ phê duyệt','Bài đăng \"Đế tản nhiệt laptop\" của bạn đang chờ phê duyệt','post_approval',0,'2025-05-10 01:27:19'),(6,4,'Bài đăng được duyệt','Bài đăng \"Sách Giải tích\" của bạn đã được duyệt','post_approval',1,'2025-05-10 08:00:50'),(7,4,'Bài đăng bị từ chối','Bài đăng \"Áo đồng phục size M\" của bạn đã bị từ chối. Lý do: annh khong chuan','post_approval',1,'2025-05-10 08:01:17'),(8,5,'Bài đăng được duyệt','Bài đăng \"Máy tính bỏ túi đồ họa\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:04:46'),(9,9,'Bài đăng được duyệt','Bài đăng \"Bóng rổ\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:04:49'),(10,3,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:04:59'),(11,4,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:04:59'),(12,5,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:04:59'),(13,6,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:04:59'),(14,7,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:04:59'),(15,8,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:04:59'),(16,9,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:04:59'),(17,10,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:04:59'),(18,11,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:04:59'),(19,3,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:07:07'),(20,4,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:07:07'),(21,5,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:07:07'),(22,6,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:07:07'),(23,7,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:07:07'),(24,8,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:07:07'),(25,9,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:07:07'),(26,10,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:07:07'),(27,11,'Hoạt động đã bị xóa','Hoạt động \"test thong bao\" đã bị xóa bởi quản trị viên','activity_update',0,'2025-05-10 08:07:07'),(28,5,'Bài đăng được duyệt','Bài đăng \"Giày đá bóng size 42\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:07:44'),(29,5,'Bài đăng được duyệt','Bài đăng \"Đàn guitar acoustic\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:07:47'),(30,8,'Bài đăng được duyệt','Bài đăng \"Đàn organ điện tử\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:07:50'),(31,4,'Bài đăng được duyệt','Bài đăng \"Dụng cụ sắp xếp tủ đựng đồ\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:07:53'),(32,10,'Bài đăng được duyệt','Bài đăng \"Hộp cơm giữ nhiệt\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:07:56'),(33,10,'Bài đăng được duyệt','Bài đăng \"Chuột không dây\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:08:03'),(34,9,'Bài đăng được duyệt','Bài đăng \"Sách Vật lý cho Sinh viên và Kỹ sư\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:08:28'),(35,9,'Bài đăng được duyệt','Bài đăng \"Bộ vở\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:09:10'),(36,10,'Bài đăng được duyệt','Bài đăng \"Bộ văn phòng phẩm\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:09:33'),(37,4,'Bài đăng được duyệt','Bài đăng \"Áo khoác đồng phục mùa đông\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:09:42'),(38,7,'Bài đăng được duyệt','Bài đăng \"USB 64GB\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:09:50'),(39,6,'Bài đăng được duyệt','Bài đăng \"Sách hướng dẫn thí nghiệm Hóa học\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:09:54'),(40,8,'Bài đăng được duyệt','Bài đăng \"Bộ sách Văn học\" của bạn đã được duyệt','post_approval',0,'2025-05-10 08:09:57'),(41,4,'Bài đăng được duyệt','Bài đăng \"Quả bóng đá mới \" của bạn đã được duyệt','post_approval',0,'2025-05-10 09:18:23'),(42,8,'Bài đăng được duyệt','Bài đăng \"Đế tản nhiệt laptop\" của bạn đã được duyệt','post_approval',0,'2025-05-10 09:23:00'),(43,6,'Bài đăng được duyệt','Bài đăng \"Áo đội tuyển thể thao size L\" của bạn đã được duyệt','post_approval',0,'2025-05-10 09:30:53');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-10 17:04:29

-- Create database
CREATE DATABASE IF NOT EXISTS school_exchange;
USE school_exchange;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    school varchar(255),
    avatar MEDIUMBLOB,
    role_id INT NOT NULL,
    status ENUM('active', 'locked', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(15, 2),
    category_id INT NOT NULL,
    location VARCHAR(100) NOT NULL,
    author_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'deleted') DEFAULT 'pending',
    rejection_reason TEXT,
    availability ENUM('available', 'sold') DEFAULT 'available', -- ✅ thêm trạng thái còn/hết hàng
    status_update_date TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);


-- Create post_images table
CREATE TABLE IF NOT EXISTS post_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    image_data MEDIUMBLOB NOT NULL, -- chứa dữ liệu ảnh
    image_type VARCHAR(50),        -- ví dụ: 'image/jpeg' hoặc 'image/png'
    image_role ENUM('thumbnail', 'image') NOT NULL DEFAULT 'thumbnail', -- phân loại ảnh
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    location VARCHAR(100) NOT NULL,
    organizer_id INT NOT NULL,
	name_organizer VARCHAR(255) NOT NULL, -- Thêm trường mới
    guidelines TEXT,  -- Thêm trường guidelines
    status ENUM('pending', 'approved', 'deleted') DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create activity_items table
CREATE TABLE IF NOT EXISTS activity_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity_needed INT NOT NULL DEFAULT 0,
    quantity_received INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);


-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('post_approval', 'activity_update', 'system') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'System Administrator'),
('teacher', 'School Teacher'),
('student', 'Student');

-- Insert sample admin user (password: admin123)
-- 1) Wipe out everything in the correct order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE post_images;
TRUNCATE TABLE posts;
TRUNCATE TABLE notifications;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE activity_items;
TRUNCATE TABLE activities;
TRUNCATE TABLE users;
TRUNCATE TABLE categories;
TRUNCATE TABLE roles;
SET FOREIGN_KEY_CHECKS = 1;

-- 2) Re‐insert sample data

-- Chèn vai trò người dùng
INSERT INTO roles (name, description) VALUES
('admin', 'Quản trị viên hệ thống'),
('user', 'Người dùng thông thường');

-- Chèn người dùng (mật khẩu được băm bằng MD5 cho mục đích minh họa, nên sử dụng băm mạnh hơn trong môi trường thực tế)
INSERT INTO users (username, password, email, full_name, phone, address, school, role_id, status) VALUES
-- Quản trị viên
('admin1', '1', 'admin1@truong.edu.vn', 'Nguyễn Văn Admin', '0901234567', 'Số 123 đường Quản Trị, Hà Nội', 'Trường THPT Quản Trị', 1, 'active'),
('admin2', '2', 'admin2@truong.edu.vn', 'Trần Thị Quản Lý', '0901234568', 'Số 124 đường Quản Trị, Hà Nội', 'Trường THPT Quản Trị', 1, 'active'),

-- Người dùng thông thường (giáo viên, học sinh)
('giaovien1', '1', 'giaovien1@truong.edu.vn', 'Phạm Thị Hương', '0901234570', 'Số 101 đường Giáo Viên, Hà Nội', 'Trường THPT Nguyễn Du', 2, 'active'),
('hocsinh1', '1', 'hocsinh1@truong.edu.vn', 'Lê Văn Nam', '0901234571', 'Số 201 đường Học Sinh, Hà Nội', 'Trường THPT Nguyễn Du', 2, 'active'),
('hocsinh2', '2', 'hocsinh2@truong.edu.vn', 'Nguyễn Thị Hà', '0901234572', 'Số 202 đường Học Sinh, Hà Nội', 'Trường THPT Nguyễn Du', 2, 'active'),
('hocsinh3', '3', 'hocsinh3@truong.edu.vn', 'Trần Văn Minh', '0901234573', 'Số 203 đường Học Sinh, Hà Nội', 'Trường THPT Chu Văn An', 2, 'active'),
('hocsinh4', '4', 'hocsinh4@truong.edu.vn', 'Phạm Thị Lan', '0901234574', 'Số 204 đường Học Sinh, Hà Nội', 'Trường THPT Chu Văn An', 2, 'active'),
('hocsinh5', '5', 'hocsinh5@truong.edu.vn', 'Đỗ Hoàng Long', '0901234575', 'Số 205 đường Học Sinh, Hà Nội', 'Trường THPT Việt Đức', 2, 'active'),
('hocsinh6', '6', 'hocsinh6@truong.edu.vn', 'Vũ Thị Hồng', '0901234576', 'Số 206 đường Học Sinh, Hà Nội', 'Trường THPT Việt Đức', 2, 'active'),
('giaovien2', '2', 'giaovien2@truong.edu.vn', 'Trần Văn Thắng', '0901234577', 'Số 102 đường Giáo Viên, Hà Nội', 'Trường THPT Phan Đình Phùng', 2, 'active'),
('giaovien3', '3', 'giaovien3@truong.edu.vn', 'Nguyễn Thị Thanh', '0901234578', 'Số 103 đường Giáo Viên, Hà Nội', 'Trường THPT Lê Quý Đôn', 2, 'active');

-- Chèn danh mục
INSERT INTO categories (name, description) VALUES
('Sách', 'Sách giáo khoa, tiểu thuyết và các tài liệu đọc khác'),
('Thiết bị điện tử', 'Máy tính, máy tính bỏ túi và các thiết bị điện tử khác'),
('Quần áo', 'Đồng phục, giày dép và các vật dụng quần áo khác'),
('Dụng cụ thể thao', 'Bóng, vợt và các dụng cụ thể thao khác'),
('Đồ dùng học tập', 'Vở, bút và các vật dụng văn phòng phẩm khác'),
('Nhạc cụ', 'Đàn guitar, sáo và các nhạc cụ khác'),
('Khác', 'Các vật dụng không thuộc các danh mục khác');

-- Chèn bài đăng
-- Chèn bài đăng
INSERT INTO posts (title, description, price, category_id, location, author_id, status, availability) VALUES
-- Sách
('Sách Giải tích', 'Sách Giải tích lớp 12, đã sử dụng nhẹ với một số ghi chú nhỏ', 250000, 1, 'Trường THPT Nguyễn Du', 4, 'pending', 'available'),
('Sách hướng dẫn thí nghiệm Hóa học', 'Sách hướng dẫn thí nghiệm Hóa học lớp 11, chưa sử dụng', 150000, 1, 'Trường THPT Chu Văn An', 6, 'approved', 'available'),
('Bộ sách Văn học', 'Bộ 5 cuốn sách văn học kinh điển cần thiết cho lớp Văn', 300000, 1, 'Trường THPT Việt Đức', 8, 'approved', 'available'),
('Sách Vật lý cho Sinh viên và Kỹ sư', 'Sách Vật lý đại học trong tình trạng tuyệt vời', 350000, 1, 'Trường THPT Phan Đình Phùng', 9, 'approved', 'available'),

-- Thiết bị điện tử
('Máy tính bỏ túi đồ họa', 'Máy tính Casio fx-580 hoạt động hoàn hảo', 450000, 2, 'Trường THPT Nguyễn Du', 5, 'approved', 'sold'),
('USB 64GB', 'USB mới chưa sử dụng', 120000, 2, 'Trường THPT Chu Văn An', 7, 'approved', 'available'),
('Chuột không dây', 'Chuột không dây Logitech, đã sử dụng nhẹ', 100000, 2, 'Trường THPT Lê Quý Đôn', 10, 'approved', 'sold'),
('Đế tản nhiệt laptop', 'Đế tản nhiệt cho laptop đến 17 inch', 150000, 2, 'Trường THPT Việt Đức', 8, 'pending', 'available'),

-- Quần áo
('Áo đồng phục size M', 'Áo đồng phục màu xanh size M, mặc một lần', 80000, 3, 'Trường THPT Nguyễn Du', 4, 'approved', 'available'),
('Áo đội tuyển thể thao size L', 'Áo đội tuyển trường size L, tình trạng tốt', 120000, 3, 'Trường THPT Chu Văn An', 6, 'approved', 'available'),
('Áo khoác đồng phục mùa đông', 'Áo khoác đồng phục mùa đông size S, như mới', 250000, 3, 'Trường THPT Nguyễn Du', 4, 'approved', 'available'),

-- Dụng cụ thể thao
('Bóng rổ', 'Bóng rổ kích thước tiêu chuẩn, đã sử dụng nhẹ', 150000, 4, 'Trường THPT Phan Đình Phùng', 9, 'approved', 'available'),
('Vợt tennis', 'Vợt tennis Wilson kèm bao đựng', 300000, 4, 'Trường THPT Lê Quý Đôn', 10, 'approved', 'available'),
('Giày đá bóng size 42', 'Giày đá bóng Adidas size 42, sử dụng một mùa', 200000, 4, 'Trường THPT Nguyễn Du', 5, 'approved', 'sold'),

-- Đồ dùng học tập
('Máy tính khoa học', 'Máy tính khoa học cơ bản, hoạt động tốt', 50000, 5, 'Trường THPT Chu Văn An', 7, 'approved', 'available'),
('Bộ dụng cụ vẽ', 'Bộ dụng cụ vẽ đầy đủ với bút chì, than và tẩy', 180000, 5, 'Trường THPT Việt Đức', 8, 'approved', 'available'),
('Bộ vở', '5 quyển vở mới, kiểu ô ly', 70000, 5, 'Trường THPT Phan Đình Phùng', 9, 'approved', 'available'),
('Bộ văn phòng phẩm', 'Bộ văn phòng phẩm đầy đủ với bút, bút dạ quang và giấy note', 100000, 5, 'Trường THPT Lê Quý Đôn', 10, 'pending', 'available'),

-- Nhạc cụ
('Đàn guitar acoustic', 'Đàn guitar cho người mới bắt đầu kèm hộp đựng và pick', 650000, 6, 'Trường THPT Nguyễn Du', 5, 'approved', 'available'),
('Sáo', 'Sáo trúc dành cho học sinh, tình trạng tốt', 500000, 6, 'Trường THPT Chu Văn An', 6, 'approved', 'available'),
('Đàn organ điện tử', 'Đàn organ 61 phím với chân đế', 750000, 6, 'Trường THPT Việt Đức', 8, 'approved', 'available'),

-- Khác
('Balo', 'Balo màu đen hiệu Sakos, đã sử dụng nhẹ', 200000, 7, 'Trường THPT Phan Đình Phùng', 9, 'approved', 'available'),
('Hộp cơm giữ nhiệt', 'Hộp cơm giữ nhiệt, như mới', 80000, 7, 'Trường THPT Lê Quý Đôn', 10, 'approved', 'available'),
('Dụng cụ sắp xếp tủ đựng đồ', 'Dụng cụ sắp xếp tủ đựng đồ có gương', 120000, 7, 'Trường THPT Nguyễn Du', 4, 'approved', 'available');


INSERT INTO activities (title, description, start_date, end_date, location, organizer_id, name_organizer, guidelines, status) VALUES
('Hội chợ trao đổi sách', 'Sự kiện trao đổi sách thường niên tại thư viện trung tâm', '2025-06-15 09:00:00', '2025-06-15 16:00:00', 'Thư viện Trung tâm', 1, 'Đoàn Thanh niên', 'Mang theo sách cần trao đổi và thẻ học sinh', 'approved'),
('Chiến dịch tái chế thiết bị điện tử', 'Mang thiết bị điện tử cũ của bạn để tái chế đúng cách', '2025-07-10 10:00:00', '2025-07-10 15:00:00', 'Nhà thi đấu trường học', 1, 'Câu lạc bộ Môi trường', 'Đảm bảo thiết bị còn hoạt động tốt', 'approved'),
('Giao lưu trao đổi dụng cụ thể thao', 'Trao đổi dụng cụ thể thao với các bạn học sinh khác', '2025-08-05 13:00:00', '2025-08-05 17:00:00', 'Sân trường', 1, 'Câu lạc bộ Thể thao', 'Mang theo dụng cụ thể thao cần trao đổi', 'approved');

-- Chèn các mục hoạt động
INSERT INTO activity_items (activity_id, name, description, quantity_needed, quantity_received) VALUES
(1, 'Bàn gấp', 'Bàn để trưng bày sách', 10, 5),
(1, 'Ghế', 'Ghế cho người tham gia', 20, 15),
(1, 'Hộp phân loại sách', 'Hộp carton để phân loại sách theo thể loại', 15, 10),
(2, 'Thùng thu gom', 'Thùng lớn để thu gom đồ điện tử', 8, 3),
(2, 'Poster thông tin', 'Poster giải thích quy trình tái chế', 12, 12),
(3, 'Giá trưng bày', 'Giá để trưng bày thiết bị', 6, 0),
(3, 'Bóng thể thao', 'Các loại bóng để trình diễn', 10, 2);

-- Chèn thông báo mẫu
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(4, 'Bài đăng được chấp nhận', 'Bài đăng "Sách Giải tích" của bạn đã được chấp nhận', 'post_approval', FALSE),
(5, 'Bài đăng được chấp nhận', 'Bài đăng "Máy tính bỏ túi đồ họa" của bạn đã được chấp nhận', 'post_approval', TRUE),
(6, 'Cập nhật hoạt động', 'Hoạt động "Hội chợ trao đổi sách" đã được cập nhật', 'activity_update', FALSE),
(7, 'Thông báo hệ thống', 'Chào mừng đến với Nền tảng Trao đổi Học đường', 'system', TRUE),
(8, 'Bài đăng đang chờ phê duyệt', 'Bài đăng "Đế tản nhiệt laptop" của bạn đang chờ phê duyệt', 'post_approval', FALSE);

-- Chèn nhật ký kiểm toán mẫu
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value) VALUES
(1, 'create', 'post', 1, NULL, '{"title":"Sách Giải tích","status":"pending"}'),
(1, 'update', 'post', 1, '{"status":"pending"}', '{"status":"approved"}'),
(1, 'create', 'activity', 1, NULL, '{"title":"Hội chợ trao đổi sách","status":"pending"}'),
(2, 'update', 'activity', 1, '{"status":"pending"}', '{"status":"approved"}'),
(1, 'create', 'user', 4, NULL, '{"username":"hocsinh1","status":"active"}');

-- Thêm cột status_update_date vào bảng posts
ALTER TABLE posts ADD COLUMN status_update_date TIMESTAMP NULL DEFAULT NULL;




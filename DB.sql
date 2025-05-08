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
    avatar_url VARCHAR(255),
    role_id INT NOT NULL,
    status ENUM('active', 'locked', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Create post_images table
CREATE TABLE IF NOT EXISTS post_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
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
    status ENUM('pending', 'approved', 'deleted') DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- Create activity_items table
CREATE TABLE IF NOT EXISTS activity_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity_needed INT NOT NULL,
    quantity_received INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- Create activity_participants table
CREATE TABLE IF NOT EXISTS activity_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('interested', 'joined') DEFAULT 'interested',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
TRUNCATE TABLE activity_participants;
TRUNCATE TABLE activity_items;
TRUNCATE TABLE activities;
TRUNCATE TABLE users;
TRUNCATE TABLE categories;
TRUNCATE TABLE roles;
SET FOREIGN_KEY_CHECKS = 1;

-- 2) Re‐insert sample data

-- 2.1 Roles
INSERT INTO roles (name, description) VALUES
('admin', 'System Administrator'),
('user', 'Regular User');

-- 2.2 Users (passwords should be your bcrypt hashes)
INSERT INTO users (username, password, email, full_name, phone, address, school, role_id, status) VALUES
-- Admin users
('admin1', '$2y$10$GjB.3hHn.eUZzJzF7HVE3OQy0GFk2vohKlXVl2VtSgiYJITBIlEcK', 'admin1@school.edu', 'Admin User 1', '0901234567', '123 Admin St', 'School Admin', 1, 'active'),
('admin2', '$2y$10$KlHy5iZ7O.C3bdT.tGQ1UuJpJKjL2XmOLwxR.SSjKJpTnJ0iUzjuy', 'admin2@school.edu', 'Admin User 2', '0901234568', '124 Admin St', 'School Admin', 1, 'active'),

-- Regular users (teachers, students)
('teacher1', '$2y$10$Y3MKvW.5kJn9Wd8y0s2C0eXJrEf7VVha57LGxe9Hl4qMxUVL/GUWC', 'teacher1@school.edu', 'Teacher One', '0901234570', '101 Teacher Ave', 'Central High School', 2, 'active'),
('student1', '$2y$10$fmZ6ov3hUlWq0GYrLE/55OEFpKm4j/7oge1kpGLuj.WZVLvyTsI3a', 'student1@school.edu', 'Student One', '0901234571', '201 Student Blvd', 'Central High School', 2, 'active'),
('student2', '$2y$10$8tJwJ5QcGqYBLnvvHLs.LeKuS/DcDR7Cz5I8VmYq0D.bvGmM36gnm', 'student2@school.edu', 'Student Two', '0901234572', '202 Student Blvd', 'Central High School', 2, 'active'),
('student3', '$2y$10$t1Cj.7./wQoGBL8jgSgfRe3LxMYGxu/gZnQu1YlxvQlT4KlQv3PwG', 'student3@school.edu', 'Student Three', '0901234573', '203 Student Blvd', 'East High School', 2, 'active'),
('student4', '$2y$10$1hGtwNfBJUVYPZnCEuIY6.oMBlOVoxUXFDOkzXKVboGKQqbI.9n2S', 'student4@school.edu', 'Student Four', '0901234574', '204 Student Blvd', 'East High School', 2, 'active'),
('student5', '$2y$10$kJ.GfGaVRMIzfKfLFYPZTO6gBVtCRkY0V9AgQyaEJapz0I/L.8yMa', 'student5@school.edu', 'Student Five', '0901234575', '205 Student Blvd', 'West High School', 2, 'active'),
('student6', '$2y$10$e2JYrZYbDsMes3t27G9A1.q/cUgZPmOGtBi0MVI9qeEiYQvMgq6Uy', 'student6@school.edu', 'Student Six', '0901234576', '206 Student Blvd', 'West High School', 2, 'active'),
('teacher2', '$2y$10$W3Sjs4VGBn4.j6Ol2iNG8ecEEPwK3QYPB6JYJYl6TXkwxPBI07aeO', 'teacher2@school.edu', 'Teacher Two', '0901234577', '102 Teacher Ave', 'North High School', 2, 'active'),
('teacher3', '$2y$10$rVewLiOInrLmrmKhW5Uice9z/IgAfWTQCgj/uB1G31cLUOA0pBlrS', 'teacher3@school.edu', 'Teacher Three', '0901234578', '103 Teacher Ave', 'South High School', 2, 'active');


-- 2.3 Categories
INSERT INTO categories (name, description) VALUES
('Books', 'Textbooks, novels, and other reading materials'),
('Electronics', 'Computers, calculators, and other electronic devices'),
('Clothing', 'Uniforms, shoes, and other clothing items'),
('Sports Equipment', 'Balls, rackets, and other sports gear'),
('School Supplies', 'Notebooks, pens, and other stationery'),
('Musical Instruments', 'Guitars, flutes, and other instruments'),
('Other', 'Items that do not fit in other categories');

-- 2.4 Posts
INSERT INTO posts (title, description, price, category_id, location, author_id, status) VALUES
-- Books
('Calculus Textbook', 'Calculus: Early Transcendentals 8th Edition, slightly used with minimal markings', 25.00, 1, 'Central High School', 4, 'approved'),
('Chemistry Lab Manual', 'Chemistry lab manual for grade 11, never used', 15.00, 1, 'East High School', 6, 'approved'),
('English Literature Collection', 'Set of 5 classic literature books required for English class', 30.00, 1, 'West High School', 8, 'approved'),
('Physics for Scientists and Engineers', 'College-level physics textbook in excellent condition', 35.00, 1, 'North High School', 9, 'approved'),

-- Electronics
('Graphing Calculator', 'TI-84 Plus graphing calculator, works perfectly', 45.00, 2, 'Central High School', 5, 'approved'),
('USB Flash Drive 64GB', 'Brand new USB drive, never used', 12.00, 2, 'East High School', 7, 'approved'),
('Wireless Mouse', 'Logitech wireless mouse, lightly used', 10.00, 2, 'South High School', 10, 'approved'),
('Laptop Cooling Pad', 'Cooling pad for laptops up to 17 inches', 15.00, 2, 'West High School', 8, 'pending'),

-- Clothing
('School Uniform Shirt Size M', 'Blue school uniform shirt size M, worn only once', 8.00, 3, 'Central High School', 4, 'approved'),
('Sports Jersey Size L', 'School team jersey size L, excellent condition', 12.00, 3, 'East High School', 6, 'approved'),
('Winter School Jacket', 'School winter jacket size S, like new', 25.00, 3, 'West High School', 4, 'approved'),

-- Sports Equipment
('Basketball', 'Official size basketball, slightly used', 15.00, 4, 'North High School', 9, 'approved'),
('Tennis Racket', 'Wilson tennis racket with cover', 30.00, 4, 'South High School', 10, 'approved'),
('Soccer Cleats Size 9', 'Adidas soccer cleats size 9, used for one season', 20.00, 4, 'Central High School', 5, 'approved'),

-- School Supplies
('Scientific Calculator', 'Basic scientific calculator, works great', 5.00, 5, 'East High School', 7, 'approved'),
('Art Supply Kit', 'Complete art supply kit with pencils, charcoal, and erasers', 18.00, 5, 'West High School', 8, 'approved'),
('Notebook Bundle', '5 unused notebooks, college ruled', 7.00, 5, 'North High School', 9, 'approved'),
('Stationery Set', 'Complete stationery set with pens, highlighters, and sticky notes', 10.00, 5, 'South High School', 10, 'pending'),

-- Musical Instruments
('Acoustic Guitar', 'Beginner acoustic guitar with case and picks', 65.00, 6, 'Central High School', 5, 'approved'),
('Flute', 'Student model flute in good condition', 50.00, 6, 'East High School', 6, 'approved'),
('Electronic Keyboard', '61-key electronic keyboard with stand', 75.00, 6, 'West High School', 8, 'approved'),

-- Other
('Backpack', 'Black JanSport backpack, lightly used', 20.00, 7, 'North High School', 9, 'approved'),
('Lunch Box', 'Insulated lunch box, like new', 8.00, 7, 'South High School', 10, 'approved'),
('School Locker Organizer', 'Magnetic locker organizer with mirror', 12.00, 7, 'Central High School', 4, 'approved');


-- 2.5 Post Images
INSERT INTO post_images (post_id, image_url) VALUES
(1, 'images/posts/calculus_textbook_1.jpg'),
(1, 'images/posts/calculus_textbook_2.jpg'),
(2, 'images/posts/chemistry_manual_1.jpg'),
(3, 'images/posts/literature_books_1.jpg'),
(3, 'images/posts/literature_books_2.jpg'),
(3, 'images/posts/literature_books_3.jpg'),
(4, 'images/posts/physics_book_1.jpg'),
(5, 'images/posts/calculator_1.jpg'),
(5, 'images/posts/calculator_2.jpg'),
(6, 'images/posts/usb_drive_1.jpg'),
(7, 'images/posts/wireless_mouse_1.jpg'),
(8, 'images/posts/cooling_pad_1.jpg'),
(9, 'images/posts/uniform_shirt_1.jpg'),
(10, 'images/posts/jersey_1.jpg'),
(11, 'images/posts/winter_jacket_1.jpg'),
(12, 'images/posts/basketball_1.jpg'),
(13, 'images/posts/tennis_racket_1.jpg'),
(13, 'images/posts/tennis_racket_2.jpg'),
(14, 'images/posts/soccer_cleats_1.jpg'),
(15, 'images/posts/sci_calculator_1.jpg'),
(16, 'images/posts/art_kit_1.jpg'),
(16, 'images/posts/art_kit_2.jpg'),
(17, 'images/posts/notebooks_1.jpg'),
(18, 'images/posts/stationery_1.jpg'),
(19, 'images/posts/guitar_1.jpg'),
(19, 'images/posts/guitar_2.jpg'),
(20, 'images/posts/flute_1.jpg'),
(21, 'images/posts/keyboard_1.jpg'),
(21, 'images/posts/keyboard_2.jpg'),
(22, 'images/posts/backpack_1.jpg'),
(23, 'images/posts/lunch_box_1.jpg'),
(24, 'images/posts/locker_org_1.jpg');


-- 2.6 Activities
INSERT INTO activities (title, description, start_date, end_date, location, organizer_id, status) VALUES
('Book Exchange Fair', 'Annual book exchange event at the central library', '2025-06-15 09:00:00', '2025-06-15 16:00:00', 'Central Library', 3, 'approved'),
('Electronics Recycling Drive', 'Bring your old electronics for proper recycling', '2025-07-10 10:00:00', '2025-07-10 15:00:00', 'School Gymnasium', 9, 'approved'),
('Sports Equipment Swap', 'Exchange sports equipment with other students', '2025-08-05 13:00:00', '2025-08-05 17:00:00', 'School Field', 10, 'pending');


-- 2.7 Activity Items
INSERT INTO activity_items (activity_id, name, description, quantity_needed, quantity_received) VALUES
(1, 'Folding Tables', 'Tables for book displays', 10, 5),
(1, 'Chairs', 'Chairs for participants', 20, 15),
(1, 'Book Sorting Boxes', 'Cardboard boxes for sorting books by genre', 15, 10),
(2, 'Collection Bins', 'Large bins for collecting electronic items', 8, 3),
(2, 'Information Posters', 'Posters explaining recycling process', 12, 12),
(3, 'Storage Racks', 'Racks for displaying equipment', 6, 0),
(3, 'Sports Balls', 'Various balls for demonstration', 10, 2);

-- 2.8 Activity Participants
INSERT INTO activity_participants (activity_id, user_id, status) VALUES
(1, 4, 'joined'),
(1, 5, 'joined'),
(1, 6, 'interested'),
(1, 7, 'joined'),
(2, 8, 'joined'),
(2, 9, 'joined'),
(2, 10, 'interested'),
(3, 4, 'interested'),
(3, 5, 'joined'),
(3, 6, 'joined');

-- 2.9 Notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(4, 'Post Approved', 'Your post "Calculus Textbook" has been approved', 'post_approval', FALSE),
(5, 'Post Approved', 'Your post "Graphing Calculator" has been approved', 'post_approval', TRUE),
(6, 'Activity Update', 'The "Book Exchange Fair" has been updated', 'activity_update', FALSE),
(7, 'System Notification', 'Welcome to School Exchange Platform', 'system', TRUE),
(8, 'Post Approval Pending', 'Your post "Laptop Cooling Pad" is pending approval', 'post_approval', FALSE);

-- 2.10 Audit Logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value) VALUES
(1, 'create', 'post', 1, NULL, '{"title":"Calculus Textbook","status":"pending"}'),
(1, 'update', 'post', 1, '{"status":"pending"}', '{"status":"approved"}'),
(1, 'create', 'activity', 1, NULL, '{"title":"Book Exchange Fair","status":"pending"}'),
(2, 'update', 'activity', 1, '{"status":"pending"}', '{"status":"approved"}'),
(1, 'create', 'user', 4, NULL, '{"username":"student1","status":"active"}');
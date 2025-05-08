const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const session = require("express-session");
const app = express();
const PORT = 3000;
const multer = require("multer");

// Cấu hình multer
const upload = multer();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true })); // Thêm dòng này
app.use(bodyParser.json());
app.use(connectLivereload());

// Thêm session middleware
app.use(
  session({
    secret: "school_exchange_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Đặt true khi dùng HTTPS
      httpOnly: true, // Bảo mật cookie
      maxAge: 24 * 60 * 60 * 1000, // 24 giờ
    },
  })
);

// Tạo server Live Reload
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, "page"));
liveReloadServer.watch(path.join(__dirname, "asset"));

// Middleware để thêm CSP header
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' http://localhost:35729;"
  );
  next();
});

// Phục vụ các file tĩnh (HTML, CSS, JS) từ thư mục "page" và "asset"
app.use("/page", express.static(path.join(__dirname, "page")));
app.use("/asset", express.static(path.join(__dirname, "asset")));

// Reload trình duyệt khi có thay đổi
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

// MySQL Connection
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "root",
  database: "school_exchange",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("Không thể kết nối tới MySQL:", err);
    return;
  }
  console.log("Kết nối MySQL thành công!");
});

// Kiểm tra xem người dùng đã đăng nhập chưa
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res
    .status(401)
    .json({ authenticated: false, message: "Bạn cần đăng nhập để truy cập" });
};

// API: Kiểm tra trạng thái xác thực
app.get("/api/auth/status", (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      authenticated: true,
      user: {
        username: req.session.user.username,
        id: req.session.user.id,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

// API: Lấy danh sách người dùng
app.get("/api/users", isAuthenticated, (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn MySQL:", err);
      res.status(500).send("Lỗi server");
      return;
    }
    res.json(results);
  });
});

// API: Lấy thông tin người dùng hiện tại
app.get("/api/user/profile", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;

  const query = `
    SELECT id, full_name AS fullname, username, school, phone, avatar_url AS avatar
    FROM users
    WHERE id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn thông tin người dùng:", err);
      return res.status(500).send("Lỗi server");
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(results[0]);
  });
});

// API: Lấy danh sách sản phẩm đã đăng của người dùng
app.get("/api/user/products", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;

  const query = `
    SELECT 
      p.id, 
      p.title, 
      p.price, 
      p.created_at AS date, 
      p.location, 
      c.name AS categoryName, 
      p.status
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    WHERE p.author_id = ? AND p.status IN ('approved', 'pending') -- Lấy sản phẩm approved hoặc pending
    ORDER BY p.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn danh sách sản phẩm:", err);
      return res.status(500).send("Lỗi server");
    }

    res.json(results);
  });
});

// API: Kiểm tra đăng nhập
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn MySQL:", err);
      res.status(500).send("Lỗi server");
      return;
    }
    if (results.length > 0) {
      // Lưu thông tin người dùng vào session
      req.session.user = results[0];
      res.json({ success: true, user: results[0] });
    } else {
      res.json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng!",
      });
    }
  });
});

app.get("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Lỗi khi đăng xuất" });
    }
    res.clearCookie("connect.sid"); // Xóa cookie session
    res.json({ success: true, message: "Đã đăng xuất thành công" });
  });
});

// API: Lấy danh sách bài đăng
app.get("/api/posts", isAuthenticated, (req, res) => {
  const query = `
    SELECT 
      p.id, 
      p.title, 
      p.description, 
      p.price, 
      c.name AS categoryName, 
      p.location, 
      p.status, 
      p.created_at,
      u.username AS seller
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    JOIN users u ON p.author_id = u.id
    WHERE p.status = 'approved'
    ORDER BY p.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn danh sách bài đăng:", err);
      res.status(500).send("Lỗi server");
      return;
    }
    res.json(results);
  });
});

// API: Lấy chi tiết một bài đăng và hình ảnh của nó
app.get("/api/posts/:id", isAuthenticated, (req, res) => {
  const postId = req.params.id;

  // Query để lấy thông tin bài đăng
  const postQuery = `
    SELECT 
      p.id, 
      p.title, 
      p.description, 
      p.price, 
      c.name AS categoryName, 
      p.location, 
      p.status, 
      p.created_at,
      u.username AS seller
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    JOIN users u ON p.author_id = u.id
    WHERE p.id = ? AND p.status = 'approved'
  `;

  // Query để lấy hình ảnh của bài đăng
  const imagesQuery = `
    SELECT image_url
    FROM post_images
    WHERE post_id = ?
  `;

  // Thực hiện truy vấn thông tin bài đăng
  db.query(postQuery, [postId], (err, postResults) => {
    if (err) {
      console.error("Lỗi khi truy vấn chi tiết bài đăng:", err);
      return res.status(500).send("Lỗi server");
    }

    if (postResults.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    const post = postResults[0];

    // Thực hiện truy vấn hình ảnh
    db.query(imagesQuery, [postId], (err, imageResults) => {
      if (err) {
        console.error("Lỗi khi truy vấn hình ảnh bài đăng:", err);
        return res.status(500).send("Lỗi server");
      }

      // Thêm mảng hình ảnh vào đối tượng bài đăng
      post.images = imageResults.map((img) => img.image_url);

      res.json(post);
    });
  });
});

// API: Lấy sản phẩm theo danh mục
app.get("/api/categories/:category", isAuthenticated, (req, res) => {
  const category = req.params.category;

  const query = `
    SELECT 
      p.id, 
      p.title, 
      p.description, 
      p.price, 
      c.name AS categoryName, 
      p.location, 
      p.status, 
      p.created_at,
      u.username AS seller
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    JOIN users u ON p.author_id = u.id
    WHERE c.name = ? AND p.status = 'approved'
    ORDER BY p.created_at DESC
  `;

  db.query(query, [category], (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn sản phẩm theo danh mục:", err);
      return res.status(500).send("Lỗi server");
    }

    res.json(results);
  });
});

// API: Thêm bài đăng
app.post("/api/posts", isAuthenticated, upload.none(), (req, res) => {
  const { title, description, price, category, location } = req.body;
  const authorId = req.session.user.id;

  // Kiểm tra dữ liệu đầu vào
  if (!title || !description || !price || !category || !location) {
    return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin." });
  }

  const query = `
    INSERT INTO posts (title, description, price, category_id, location, author_id, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `;

  db.query(
    query,
    [title, description, price, category, location, authorId],
    (err, result) => {
      if (err) {
        console.error("Lỗi khi thêm bài đăng:", err);
        return res.status(500).json({ message: "Lỗi server." });
      }
      res.status(201).json({ message: "Bài đăng đã được thêm thành công!" });
    }
  );
});

// Route mặc định để phục vụ file login.html
app.get("/", (req, res) => {
  res.redirect("page/login.html");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

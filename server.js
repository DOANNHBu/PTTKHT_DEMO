const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

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
app.use("/page", express.static(path.join(__dirname, "page"))); // Sửa ở đây
app.use("/asset", express.static(path.join(__dirname, "asset")));

// Reload trình duyệt khi có thay đổi
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

// MySQL Connection
const db = mysql.createConnection({
  host: "127.0.0.1", // Thay bằng host của bạn
  user: "root", // Thay bằng username của bạn
  password: "root", // Thay bằng password của bạn
  database: "school_exchange", // Tên database
});

db.connect((err) => {
  if (err) {
    console.error("Không thể kết nối tới MySQL:", err);
    return;
  }
  console.log("Kết nối MySQL thành công!");
});

// API: Lấy danh sách người dùng
app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn MySQL:", err);
      res.status(500).send("Lỗi server");
      return;
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
      res.json({ success: true, user: results[0] });
    } else {
      res.json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng!",
      });
    }
  });
});

// Route mặc định để phục vụ file login.html
app.get("/", (req, res) => {
  res.redirect("page/login.html");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

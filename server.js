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

// Thay đổi middleware CSP
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' http://localhost:35729; connect-src 'self' ws://localhost:35729/livereload; img-src 'self' data: blob:;"
  );
  next();
});

// Phục vụ các file tĩnh (HTML, CSS, JS) từ thư mục "page" và "asset"
app.use("/page", express.static(path.join(__dirname, "page")));
app.use("/asset", express.static(path.join(__dirname, "asset")));
app.use("/images", express.static(path.join(__dirname, "all image")));

// Reload trình duyệt khi có thay đổi
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

// MySQL Connection
const db = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "root",
  database: "school_exchange",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10, // Số lượng kết nối tối đa trong pool
  queueLimit: 0,
});

// Remove the db.connect() call since it's not needed with connection pool
// Instead, we can test the connection like this:
db.getConnection((err, connection) => {
  if (err) {
    console.error("Không thể kết nối tới MySQL:", err);
    return;
  }
  console.log("Kết nối MySQL thành công!");
  connection.release();
});

// Xử lý lỗi kết nối
db.on("error", (err) => {
  console.error("Database error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("Kết nối database bị mất. Đang thử kết nối lại...");
  } else if (err.code === "ER_CON_COUNT_ERROR") {
    console.log("Database có quá nhiều kết nối.");
  } else if (err.code === "ECONNREFUSED") {
    console.log("Database từ chối kết nối.");
  } else {
    console.log("Lỗi database không xác định:", err);
  }
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

// Thêm middleware kiểm tra role user
const isUser = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role_id === 2) {
    return next();
  }
  return res.status(403).json({
    authenticated: false,
    message: "Bạn không có quyền truy cập trang này",
  });
};

// Thêm middleware kiểm tra admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role_id === 1) {
    return next();
  }
  return res.status(403).json({
    authenticated: false,
    message: "Bạn không có quyền truy cập trang này",
  });
};

// API: Kiểm tra trạng thái xác thực
app.get("/api/auth/status", (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      authenticated: true,
      user: {
        username: req.session.user.username,
        id: req.session.user.id,
        role_id: req.session.user.role_id, // ← thêm dòng này
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
app.get("/api/user/profile", isAuthenticated, isUser, (req, res) => {
  const userId = req.session.user.id;

  const query = `
    SELECT id, full_name AS fullname, username, id, school, phone, avatar, address, email, password
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

    // Chuyển đổi avatar LONGBLOB thành base64 string nếu có
    if (results[0].avatar) {
      results[0].avatar = results[0].avatar.toString("base64");
    }

    res.json(results[0]);
  });
});

// API: Cập nhật thông tin người dùng
app.put(
  "/api/user/profile",
  isAuthenticated,
  isUser,
  upload.single("avatar"),
  async (req, res) => {
    const userId = req.session.user.id;
    const { username, password, email, phone, address } = req.body;
    let avatar = null;

    if (req.file) {
      avatar = req.file.buffer;
    }

    try {
      // Kiểm tra username hoặc email đã tồn tại cho user khác chưa
      const [existing] = await db
        .promise()
        .query(
          "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?",
          [username, email, userId]
        );
      if (existing.length > 0) {
        return res
          .status(400)
          .json({ message: "Tên đăng nhập hoặc email đã tồn tại!" });
      }

      // Xây dựng câu truy vấn động
      let updateFields = [];
      let updateValues = [];
      if (username) {
        updateFields.push("username = ?");
        updateValues.push(username);
      }
      if (password) {
        updateFields.push("password = ?");
        updateValues.push(password);
      }
      if (email) {
        updateFields.push("email = ?");
        updateValues.push(email);
      }
      if (phone) {
        updateFields.push("phone = ?");
        updateValues.push(phone);
      }
      if (address) {
        updateFields.push("address = ?");
        updateValues.push(address);
      }
      if (avatar) {
        updateFields.push("avatar = ?");
        updateValues.push(avatar);
      }

      if (updateFields.length === 0) {
        return res
          .status(400)
          .json({ message: "Không có thông tin nào để cập nhật" });
      }

      updateValues.push(userId);
      const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
      await db.promise().query(sql, updateValues);

      res.json({ message: "Cập nhật thông tin thành công" });
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin người dùng:", error);
      res.status(500).json({ message: "Lỗi server khi cập nhật thông tin" });
    }
  }
);

// API: Lấy danh sách sản phẩm đã đăng của người dùng
app.get("/api/user/products", isAuthenticated, isUser, (req, res) => {
  const userId = req.session.user.id;

  const query = `
    SELECT 
      p.id, 
      p.title, 
      p.price, 
      p.created_at AS date, 
      p.location, 
      c.name AS categoryName, 
      p.status,
      p.rejection_reason,
      (SELECT image_data FROM post_images WHERE post_id = p.id AND image_role = 'thumbnail' LIMIT 1) AS thumbnail
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    WHERE p.author_id = ? AND p.status IN ('approved', 'pending', 'rejected')
    ORDER BY p.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn danh sách sản phẩm:", err);
      return res.status(500).send("Lỗi server");
    }

    results.forEach((post) => {
      if (post.thumbnail) {
        post.thumbnail = `data:image/jpeg;base64,${post.thumbnail.toString(
          "base64"
        )}`;
      } else {
        post.thumbnail = "/asset/images/default-thumbnail.png";
      }
    });

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
app.get("/api/posts", isAuthenticated, isUser, (req, res) => {
  const limit = parseInt(req.query.limit) || 16; // Số sản phẩm mỗi trang (mặc định là 20)
  const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là trang 1)
  const offset = (page - 1) * limit; // Tính toán offset
  const search = req.query.search ? `%${req.query.search}%` : null; // Từ khóa tìm kiếm
  const category =
    req.query.category && req.query.category !== "all"
      ? req.query.category
      : null; // Danh mục

  let query = `
    SELECT 
      p.id, 
      p.title, 
      p.description, 
      p.price, 
      p.location, 
      p.created_at, 
      p.availability, 
      c.name AS categoryName, 
      (SELECT image_data FROM post_images WHERE post_id = p.id AND image_role = 'thumbnail' LIMIT 1) AS thumbnail
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'approved'
  `;

  const queryParams = [];

  // Thêm điều kiện tìm kiếm nếu có từ khóa
  if (search) {
    query += ` AND p.title LIKE ? `;
    queryParams.push(search);
  }

  // Thêm điều kiện lọc danh mục nếu có
  if (category) {
    query += ` AND c.name = ? `;
    queryParams.push(category);
  }

  query += `
    ORDER BY p.availability ASC, p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  queryParams.push(limit, offset);

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn danh sách bài đăng:", err);
      res.status(500).send("Lỗi server");
      return;
    }

    // Kiểm tra và gán ảnh mặc định nếu không có ảnh
    results.forEach((post) => {
      if (post.thumbnail) {
        post.thumbnail = `data:image/jpeg;base64,${post.thumbnail.toString(
          "base64"
        )}`;
      } else {
        post.thumbnail = "/asset/images/default-thumbnail.png"; // Ảnh mặc định
      }
    });

    res.json(results);
  });
});

// API: Lấy thông tin chi tiết bài đăng
app.get("/api/posts/:id", isAuthenticated, isUser, (req, res) => {
  const postId = req.params.id;

  const query = `
    SELECT 
      p.*,
      c.name AS categoryName,
      u.full_name AS seller,
      u.phone AS sellerPhone,
      pi.image_data,
      pi.image_type,
      pi.image_role
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    JOIN users u ON p.author_id = u.id
    LEFT JOIN post_images pi ON p.id = pi.post_id
    WHERE p.id = ?
  `;

  db.query(query, [postId], (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn chi tiết bài đăng:", err);
      return res.status(500).send("Lỗi server");
    }

    if (results.length === 0) {
      return res.status(404).send("Không tìm thấy bài đăng");
    }

    // Xử lý kết quả
    const post = {
      ...results[0],
      images: [],
    };

    // Xử lý ảnh
    results.forEach((row) => {
      if (row.image_data) {
        post.images.push({
          data: `data:${row.image_type};base64,${row.image_data.toString(
            "base64"
          )}`,
          type: row.image_type,
          role: row.image_role,
        });
      }
    });

    // Xóa các trường không cần thiết
    delete post.image_data;
    delete post.image_type;
    delete post.image_role;

    // Nếu không có ảnh, thêm ảnh mặc định
    if (post.images.length === 0) {
      post.images.push({
        data: "/asset/images/default-thumbnail.png",
        type: "image/png",
        role: "thumbnail",
      });
    }

    // Format lại một số trường dữ liệu
    post.created_at = new Date(post.created_at).toLocaleString("vi-VN");
    post.status_update_date = post.status_update_date
      ? new Date(post.status_update_date).toLocaleString("vi-VN")
      : "";
    post.updated_at = new Date(post.updated_at).toLocaleString("vi-VN");
    post.price = parseFloat(post.price);

    // Thêm trạng thái được format
    post.status_text =
      {
        pending: "Chờ duyệt",
        approved: "Đã duyệt",
        rejected: "Đã từ chối",
        deleted: "Đã xóa",
      }[post.status] || post.status;

    res.json(post);
  });
});

// API: Lấy sản phẩm theo danh mục
app.get("/api/categories/:category", isAuthenticated, isUser, (req, res) => {
  const category = req.params.category;

  const query = `
    SELECT 
      p.id, 
      p.title, 
      p.description, 
      p.price, 
      p.location, 
      p.created_at, 
      p.availability, 
      c.name AS categoryName, 
      (SELECT image_data FROM post_images WHERE post_id = p.id AND image_role = 'thumbnail' LIMIT 1) AS thumbnail
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    WHERE c.name = ? AND p.status = 'approved'
    ORDER BY p.created_at DESC
  `;

  db.query(query, [category], (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn sản phẩm theo danh mục:", err);
      return res.status(500).send("Lỗi server");
    }

    // Kiểm tra và gán ảnh mặc định nếu không có ảnh
    results.forEach((post) => {
      if (post.thumbnail) {
        post.thumbnail = `data:image/jpeg;base64,${post.thumbnail.toString(
          "base64"
        )}`;
      } else {
        post.thumbnail = "/asset/images/default-thumbnail.png"; // Ảnh mặc định
      }
    });

    res.json(results);
  });
});

// Xóa định nghĩa cũ của API /api/posts ở dòng 918 và chỉ giữ phiên bản dưới đây:

app.post(
  "/api/posts",
  isAuthenticated,
  isUser,
  upload.array("images", 5),
  async (req, res) => {
    const { title, description, price, category, location, condition } =
      req.body;
    const userId = req.session.user.id;

    // Kiểm tra dữ liệu đầu vào
    if (
      !title ||
      !description ||
      !price ||
      !category ||
      !location ||
      !condition
    ) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin." });
    }

    // Kiểm tra số lượng ảnh
    if (req.files && req.files.length > 5) {
      return res
        .status(400)
        .json({ message: "Chỉ được tải lên tối đa 5 ảnh." });
    }

    const connection = await db.promise().getConnection();

    try {
      // Bắt đầu transaction
      await connection.beginTransaction();

      // Thêm bài đăng
      const [postResult] = await connection.query(
        `INSERT INTO posts (title, description, price, category_id, location, author_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [title, description, price, category, location, userId]
      );

      const postId = postResult.insertId;

      // Nếu có hình ảnh, thêm vào bảng post_images
      if (req.files && req.files.length > 0) {
        try {
          const imagePromises = req.files.map((file, index) => {
            // Kiểm tra loại file
            if (!file.mimetype.startsWith("image/")) {
              throw new Error("File không phải là hình ảnh");
            }

            const imageRole = index === 0 ? "thumbnail" : "image";
            return connection.query(
              "INSERT INTO post_images (post_id, image_data, image_type, image_role) VALUES (?, ?, ?, ?)",
              [postId, file.buffer, file.mimetype, imageRole]
            );
          });

          await Promise.all(imagePromises);
        } catch (error) {
          throw new Error("Lỗi khi lưu hình ảnh: " + error.message);
        }
      }

      // Commit transaction
      await connection.commit();

      // Ghi log tạo bài đăng
      await logAuditAction(userId, "create", "post", postId, null, {
        title,
        description,
        price,
        category,
        location,
        status: "pending",
      });

      res.status(201).json({
        message: "Bài đăng đã được thêm thành công!",
        postId: postId,
      });
    } catch (error) {
      // Rollback nếu có lỗi
      await connection.rollback();
      console.error("Lỗi khi thêm bài đăng:", error);
      res.status(500).json({
        message: "Lỗi server.",
        error: error.message,
      });
    } finally {
      // Giải phóng connection
      connection.release();
    }
  }
);

// API endpoints cho admin panel
// 1. Quản lý người dùng
app.get("/api/admin/users", isAuthenticated, isAdmin, (req, res) => {
  const query = `
    SELECT u.*, r.name as role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn users:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }
    res.json(results);
  });
});

// API: Lấy chi tiết người dùng (cho admin)
app.get("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [users] = await db.promise().query(
      `
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `,
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const user = users[0];
    // Chuyển đổi avatar sang base64 nếu có
    if (user.avatar) {
      user.avatar = user.avatar.toString("base64");
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin người dùng" });
  }
});

// API: Cập nhật thông tin người dùng (cho admin)
app.put(
  "/api/admin/users/:id",
  isAuthenticated,
  isAdmin,
  upload.single("avatar"),
  async (req, res) => {
    const userId = req.params.id;
    const adminId = req.session.user.id; // ID của admin thực hiện thay đổi
    const {
      username,
      password,
      email,
      full_name,
      phone,
      address,
      school,
      role_id,
      status,
    } = req.body;

    try {
      // Lấy dữ liệu cũ của người dùng
      const [oldUserRows] = await db
        .promise()
        .query("SELECT * FROM users WHERE id = ?", [userId]);
      const oldUser = oldUserRows[0];

      if (!oldUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Xây dựng câu truy vấn động
      let updateFields = [];
      let updateValues = [];

      if (username) {
        updateFields.push("username = ?");
        updateValues.push(username);
      }
      if (password) {
        updateFields.push("password = ?");
        updateValues.push(password);
      }
      if (email) {
        updateFields.push("email = ?");
        updateValues.push(email);
      }
      if (full_name) {
        updateFields.push("full_name = ?");
        updateValues.push(full_name);
      }
      if (phone) {
        updateFields.push("phone = ?");
        updateValues.push(phone);
      }
      if (address) {
        updateFields.push("address = ?");
        updateValues.push(address);
      }
      if (school) {
        updateFields.push("school = ?");
        updateValues.push(school);
      }
      if (role_id) {
        updateFields.push("role_id = ?");
        updateValues.push(role_id);
      }
      if (status) {
        updateFields.push("status = ?");
        updateValues.push(status);
      }

      // Thêm avatar nếu có
      if (req.file) {
        updateFields.push("avatar = ?");
        updateValues.push(req.file.buffer);
      }

      if (updateFields.length === 0) {
        return res
          .status(400)
          .json({ message: "Không có thông tin nào để cập nhật" });
      }

      updateValues.push(userId);

      // Thực hiện câu truy vấn cập nhật
      const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
      await db.promise().query(query, updateValues);

      // So sánh dữ liệu cũ và mới để ghi log
      const newUserData = {
        username,
        email,
        full_name,
        phone,
        address,
        school,
        role_id,
        status,
      };
      const { changedOld, changedNew } = getChangedFields(oldUser, newUserData);

      if (Object.keys(changedOld).length > 0) {
        await logAuditAction(
          adminId,
          "update",
          "user",
          userId,
          changedOld,
          changedNew
        );
      }

      res.json({ message: "Cập nhật thông tin người dùng thành công" });
    } catch (error) {
      console.error("Error updating user:", error);
      res
        .status(500)
        .json({ message: "Lỗi khi cập nhật thông tin người dùng" });
    }
  }
);

// 2. Quản lý bài đăng
app.get("/api/admin/posts", isAuthenticated, isAdmin, (req, res) => {
  const query = `
    SELECT p.*, u.username as author_name, c.name as category_name
    FROM posts p
    JOIN users u ON p.author_id = u.id
    JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Lỗi khi truy vấn posts:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }
    res.json(results);
  });
});

// 3. Quản lý hoạt động
app.get("/api/admin/activities", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [activities] = await db.promise().query(`
      SELECT 
        a.*,
        u.username as organizer_name,
        (SELECT 
          IF(COUNT(*) > 0,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', ai.id,
                'name', ai.name,
                'description', ai.description,
                'quantity_needed', ai.quantity_needed,
                'quantity_received', ai.quantity_received
              )
            ),
            JSON_ARRAY()
          )
        FROM activity_items ai 
        WHERE ai.activity_id = a.id) as items
      FROM activities a
      JOIN users u ON a.organizer_id = u.id
      ORDER BY a.created_at DESC
    `);

    // Chỉ parse items nếu nó là string JSON
    activities.forEach((activity) => {
      if (typeof activity.items === "string") {
        try {
          activity.items = JSON.parse(activity.items);
        } catch (e) {
          activity.items = [];
        }
      } else if (!activity.items) {
        activity.items = [];
      }
    });

    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách hoạt động" });
  }
});

// API cập nhật trạng thái bài đăng
app.put(
  "/api/admin/posts/:id/status",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const { status, rejection_reason } = req.body;
    const postId = req.params.id;
    const adminId = req.session.user.id;

    try {
      // Lấy thông tin bài đăng và người đăng
      const [postRows] = await db
        .promise()
        .query(
          "SELECT p.*, u.id as author_id FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?",
          [postId]
        );

      if (postRows.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy bài đăng" });
      }

      const oldPost = postRows[0];

      // Cập nhật trạng thái bài đăng
      await db.promise().query(
        `UPDATE posts 
         SET status = ?, 
             rejection_reason = ?,
             status_update_date = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, rejection_reason || null, postId]
      );

      // Ghi audit log nếu có thay đổi
      const newPostData = {
        status,
        rejection_reason: rejection_reason || null,
      };
      const { changedOld, changedNew } = getChangedFields(oldPost, newPostData);

      if (Object.keys(changedOld).length > 0) {
        await logAuditAction(
          adminId,
          "update",
          "post",
          postId,
          changedOld,
          changedNew
        );
      }

      // Gửi thông báo cho người đăng bài
      const notificationTitle =
        status === "approved"
          ? "Bài đăng được duyệt"
          : status === "rejected"
          ? "Bài đăng bị từ chối"
          : "Bài đăng được cập nhật";

      const notificationMessage =
        status === "rejected"
          ? `Bài đăng "${oldPost.title}" của bạn đã bị từ chối. Lý do: ${rejection_reason}`
          : `Bài đăng "${oldPost.title}" của bạn đã được ${
              status === "approved" ? "duyệt" : "cập nhật"
            }`;

      await db.promise().query(
        `INSERT INTO notifications (user_id, title, message, type, post_id) 
         VALUES (?, ?, ?, 'post_approval', ?)`,
        [oldPost.author_id, notificationTitle, notificationMessage, postId]
      );

      res.json({
        success: true,
        message:
          status === "approved" ? "Đã duyệt bài đăng" : "Đã từ chối bài đăng",
      });
    } catch (error) {
      console.error("Lỗi:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }
);

// 5. Cập nhật trạng thái người dùng
app.put("/api/admin/users/:id/status", isAuthenticated, isAdmin, (req, res) => {
  const { status } = req.body;
  const userId = req.params.id;

  const query = `
    UPDATE users 
    SET status = ? 
    WHERE id = ?
  `;

  db.query(query, [status, userId], (err, result) => {
    if (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }
    res.json({ message: "Cập nhật thành công" });
  });
});

// Xóa bài đăng

app.delete("/api/posts/:id", isAuthenticated, isUser, async (req, res) => {
  const postId = req.params.id;
  const userId = req.session.user.id;

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    // Lấy dữ liệu bài đăng để kiểm tra quyền và phục vụ ghi log
    const [oldPostRows] = await connection.query(
      "SELECT * FROM posts WHERE id = ? AND author_id = ?",
      [postId, userId]
    );
    const oldPost = oldPostRows[0];

    if (!oldPost) {
      await connection.rollback();
      connection.release();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa bài đăng này.",
      });
    }

    // Xóa hình ảnh của bài đăng
    await connection.query("DELETE FROM post_images WHERE post_id = ?", [
      postId,
    ]);

    // Xóa bài đăng
    await connection.query("DELETE FROM posts WHERE id = ?", [postId]);

    await connection.commit();
    connection.release();

    // Ghi log xóa bài đăng
    await logAuditAction(userId, "delete", "post", postId, oldPost, null);

    res.json({ success: true, message: "Xóa bài đăng thành công" });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Lỗi khi xóa bài đăng:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi xóa bài đăng" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// API để tạo hoạt động mới
// API để tạo hoạt động mới
app.post(
  "/api/admin/activities",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      const activity = req.body;
      const items = activity.items;
      delete activity.items;

      // Thêm hoạt động
      const [result] = await connection.query("INSERT INTO activities SET ?", {
        ...activity,
        organizer_id: req.session.user.id,
      });

      const activityId = result.insertId;

      // Thêm các items
      for (const item of items) {
        await connection.query("INSERT INTO activity_items SET ?", {
          ...item,
          activity_id: activityId,
        });
      }

      // Tạo thông báo cho tất cả người dùng
      const [users] = await connection.query(
        "SELECT id FROM users WHERE role_id = 2" // Lấy tất cả user thường
      );

      const notificationPromises = users.map((user) =>
        connection.query(
          `INSERT INTO notifications (user_id, title, message, type, activity_id) 
                VALUES (?, ?, ?, 'activity_update', ?)`,
          [
            user.id,
            "Hoạt động mới được tạo",
            `Hoạt động "${activity.title}" vừa được tạo. Hãy tham gia cùng chúng tôi!`,
            activityId,
          ]
        )
      );

      await Promise.all(notificationPromises);

      // Thêm audit log
      await logAuditAction(
        req.session.user.id,
        "create",
        "activity",
        activityId,
        null,
        { ...activity, items }
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: "Tạo hoạt động thành công",
        id: activityId,
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("Error creating activity:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo hoạt động",
        error: error.message,
      });
    }
  }
);

// API để lấy chi tiết hoạt động
app.get(
  "/api/admin/activities/:id",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const [activity] = await db
        .promise()
        .query("SELECT * FROM activities WHERE id = ?", [req.params.id]);

      if (activity.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy hoạt động" });
      }

      const [items] = await db
        .promise()
        .query("SELECT * FROM activity_items WHERE activity_id = ?", [
          req.params.id,
        ]);

      res.json({ ...activity[0], items });
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Lỗi khi lấy thông tin hoạt động" });
    }
  }
);

// API để cập nhật số lượng đã nhận của vật phẩm
// API để cập nhật số lượng đã nhận của vật phẩm
app.put(
  "/api/admin/activity-items/:id",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const itemId = req.params.id;
    const { quantity_received } = req.body;

    try {
      // Kiểm tra và lấy thông tin cũ của item
      const [oldItems] = await db
        .promise()
        .query("SELECT * FROM activity_items WHERE id = ?", [itemId]);

      if (oldItems.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy vật phẩm" });
      }

      const oldItem = oldItems[0];

      if (quantity_received < 0) {
        return res
          .status(400)
          .json({ message: "Số lượng không được nhỏ hơn 0" });
      }

      // Cập nhật số lượng
      await db
        .promise()
        .query("UPDATE activity_items SET quantity_received = ? WHERE id = ?", [
          quantity_received,
          itemId,
        ]);

      // Lấy thông tin mới sau khi cập nhật
      const [updatedItems] = await db
        .promise()
        .query("SELECT * FROM activity_items WHERE id = ?", [itemId]);

      // Ghi audit log khi cập nhật số lượng vật phẩm đã nhận
      await logAuditAction(
        req.session.user.id,
        "update",
        "activity_item",
        itemId,
        oldItem,
        updatedItems[0]
      );

      res.json({ message: "Cập nhật thành công" });
    } catch (error) {
      console.error("Error updating item quantity:", error);
      res.status(500).json({ message: "Lỗi khi cập nhật số lượng" });
    }
  }
);

// API để cập nhật hoạt động
// API để cập nhật hoạt động
app.put(
  "/api/admin/activities/:id",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const activityId = req.params.id;
    const activity = { ...req.body };
    const items = activity.items || [];
    delete activity.items;

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // Lấy dữ liệu cũ của hoạt động và items để ghi log
      const [oldActivityRows] = await connection.query(
        "SELECT * FROM activities WHERE id = ?",
        [activityId]
      );

      const [oldItemRows] = await connection.query(
        "SELECT * FROM activity_items WHERE activity_id = ?",
        [activityId]
      );

      const oldActivity = {
        ...oldActivityRows[0],
        items: oldItemRows,
      };

      // Cập nhật hoạt động
      await connection.query("UPDATE activities SET ? WHERE id = ?", [
        activity,
        activityId,
      ]);

      // Xóa items cũ
      await connection.query(
        "DELETE FROM activity_items WHERE activity_id = ?",
        [activityId]
      );

      // Thêm items mới
      if (items.length > 0) {
        for (const item of items) {
          await connection.query("INSERT INTO activity_items SET ?", {
            name: item.name,
            description: item.description || "",
            quantity_needed: item.quantity_needed,
            quantity_received: item.quantity_received || 0,
            activity_id: activityId,
          });
        }
      }

      // Tạo thông báo cho tất cả người dùng
      const [users] = await connection.query(
        "SELECT id FROM users WHERE role_id = 2"
      );

      const notificationPromises = users.map((user) =>
        connection.query(
          `INSERT INTO notifications (user_id, title, message, type, activity_id) 
                VALUES (?, ?, ?, 'activity_update', ?)`,
          [
            user.id,
            "Cập nhật hoạt động",
            `Hoạt động "${activity.title}" đã được cập nhật. Vui lòng kiểm tra thông tin mới.`,
            activityId,
          ]
        )
      );

      await Promise.all(notificationPromises);
      await connection.commit();

      // Ghi audit log khi cập nhật hoạt động
      await logAuditAction(
        req.session.user.id,
        "update",
        "activity",
        activityId,
        oldActivity,
        { ...activity, items }
      );

      connection.release();

      res.json({
        success: true,
        message: "Cập nhật hoạt động thành công",
        id: activityId,
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("Error updating activity:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật hoạt động",
        error: error.message,
      });
    }
  }
);

// API để xóa hoạt động
// API để xóa hoạt động
app.delete(
  "/api/admin/activities/:id",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const activityId = req.params.id;
    const connection = await db.promise().getConnection();

    try {
      await connection.beginTransaction();

      // Lấy thông tin hoạt động và items trước khi xóa để ghi log
      const [activityRows] = await connection.query(
        "SELECT * FROM activities WHERE id = ?",
        [activityId]
      );

      const [itemRows] = await connection.query(
        "SELECT * FROM activity_items WHERE activity_id = ?",
        [activityId]
      );

      if (activityRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hoạt động",
        });
      }

      const oldActivity = {
        ...activityRows[0],
        items: itemRows,
      };

      // Tạo thông báo cho tất cả người dùng về việc xóa hoạt động
      const [users] = await connection.query(
        "SELECT id FROM users WHERE role_id = 2"
      );
      const notificationPromises = users.map((user) =>
        connection.query(
          `INSERT INTO notifications (user_id, title, message, type, activity_id) 
                VALUES (?, ?, ?, 'activity_update', ?)`,
          [
            user.id,
            "Hoạt động đã bị xóa",
            `Hoạt động "${activityRows[0].title}" đã bị xóa bởi quản trị viên`,
            activityId,
          ]
        )
      );

      // Xóa items và hoạt động
      await connection.query(
        "DELETE FROM activity_items WHERE activity_id = ?",
        [activityId]
      );
      await connection.query("DELETE FROM activities WHERE id = ?", [
        activityId,
      ]);

      await Promise.all(notificationPromises);
      await connection.commit();

      // Ghi audit log khi xóa hoạt động
      await logAuditAction(
        req.session.user.id,
        "delete",
        "activity",
        activityId,
        oldActivity,
        null
      );

      connection.release();

      res.json({
        success: true,
        message: "Xóa hoạt động thành công",
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("Error deleting activity:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa hoạt động",
        error: error.message,
      });
    }
  }
);

// API lấy danh sách hoạt động cho user - cập nhật lại route
app.get("/api/public/activities", async (req, res) => {
  try {
    const [activities] = await db.promise().query(`
            SELECT 
                a.*
            FROM activities a
            WHERE a.status = 'approved'
            ORDER BY a.start_date DESC
        `);

    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách hoạt động" });
  }
});

// API lấy chi tiết một hoạt động - cập nhật lại route
app.get("/api/public/activities/:id", async (req, res) => {
  try {
    // Lấy thông tin hoạt động
    const [activities] = await db.promise().query(
      `
            SELECT 
                a.*
            FROM activities a
            WHERE a.id = ? AND a.status = 'approved'
        `,
      [req.params.id]
    );

    if (activities.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy hoạt động" });
    }

    const activity = activities[0];

    // Lấy danh sách items
    const [items] = await db.promise().query(
      `
            SELECT * 
            FROM activity_items 
            WHERE activity_id = ?
        `,
      [req.params.id]
    );

    activity.items = items;

    res.json(activity);
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin hoạt động" });
  }
});

// API tạo tài khoản mới (chỉ admin)
app.post(
  "/api/admin/users",
  isAuthenticated,
  isAdmin,
  upload.single("avatar"),
  async (req, res) => {
    const {
      username,
      password,
      email,
      full_name,
      phone,
      address,
      school,
      role_id,
    } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!username || !password || !email || !full_name || !role_id) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // Kiểm tra username và email đã tồn tại chưa
      const [existingUser] = await connection.query(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        [username, email]
      );

      if (existingUser.length > 0) {
        await connection.rollback();
        connection.release();
        return res
          .status(400)
          .json({ message: "Tên đăng nhập hoặc email đã tồn tại" });
      }

      let avatar = null;
      if (req.file) {
        avatar = req.file.buffer;
      }

      // Thêm người dùng mới
      const [result] = await connection.query(
        "INSERT INTO users (username, password, email, full_name, phone, address, school, avatar, role_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          username,
          password,
          email,
          full_name,
          phone || null,
          address || null,
          school || null,
          avatar,
          role_id,
        ]
      );

      // Thêm thông báo chào mừng cho người dùng mới
      await connection.query(
        `INSERT INTO notifications (user_id, title, message, type) 
            VALUES (?, 'Thông báo hệ thống', 'Chào mừng đến với Nền tảng Trao đổi Học đường', 'system')`,
        [result.insertId]
      );

      await connection.commit();
      connection.release();

      res.status(201).json({
        message: "Tạo tài khoản thành công",
        userId: result.insertId,
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("Lỗi khi tạo tài khoản:", error);
      res.status(500).json({ message: "Lỗi server khi tạo tài khoản" });
    }
  }
);

// API xóa người dùng (chỉ admin)
app.delete(
  "/api/admin/users/:id",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const userId = req.params.id;

    try {
      // Kiểm tra xem user có tồn tại không
      const [user] = await db
        .promise()
        .query("SELECT role_id FROM users WHERE id = ?", [userId]);

      if (user.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Không cho phép xóa admin khác
      if (user[0].role_id === 1 && req.session.user.id !== parseInt(userId)) {
        return res
          .status(403)
          .json({ message: "Không thể xóa tài khoản admin khác" });
      }

      // Bắt đầu transaction
      const connection = await db.promise().getConnection();
      await connection.beginTransaction();

      try {
        // 1. Xóa tất cả hình ảnh của bài đăng của user
        await connection.query(
          "DELETE pi FROM post_images pi INNER JOIN posts p ON pi.post_id = p.id WHERE p.author_id = ?",
          [userId]
        );

        // 2. Xóa tất cả bài đăng của user
        await connection.query("DELETE FROM posts WHERE author_id = ?", [
          userId,
        ]);

        // 3. Xóa tất cả thông báo của user
        await connection.query("DELETE FROM notifications WHERE user_id = ?", [
          userId,
        ]);

        // 6. Cuối cùng xóa user
        await connection.query("DELETE FROM users WHERE id = ?", [userId]);

        // Commit transaction
        await connection.commit();
        connection.release();

        res.json({
          message: "Đã xóa người dùng và tất cả thông tin liên quan thành công",
          deletedUserId: userId,
        });
      } catch (error) {
        // Rollback nếu có lỗi
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error("Lỗi khi xóa người dùng:", error);
      res.status(500).json({
        message: "Lỗi server khi xóa người dùng",
        error: error.message,
      });
    }
  }
);

// API: Lấy chi tiết bài đăng cho admin
app.get("/api/admin/posts/:id", isAuthenticated, isAdmin, async (req, res) => {
  const postId = req.params.id;

  try {
    // Lấy thông tin bài đăng
    const [posts] = await db.promise().query(
      `
          SELECT 
              p.*,
              u.username as author_name,
              c.name as category_name
          FROM posts p
          JOIN users u ON p.author_id = u.id
          JOIN categories c ON p.category_id = c.id
          WHERE p.id = ?
      `,
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    const post = posts[0];

    // Lấy hình ảnh riêng
    const [images] = await db.promise().query(
      `
          SELECT 
              id,
              CONCAT('data:', image_type, ';base64,', TO_BASE64(image_data)) as image_url,
              image_type,
              image_role
          FROM post_images 
          WHERE post_id = ?
      `,
      [postId]
    );

    // Thêm mảng ảnh vào đối tượng post
    post.images = images;

    // Format lại một số trường dữ liệu
    post.created_at = new Date(post.created_at).toLocaleString("vi-VN");
    post.status_update_date = post.status_update_date
      ? new Date(post.status_update_date).toLocaleString("vi-VN")
      : "";
    post.updated_at = new Date(post.updated_at).toLocaleString("vi-VN");
    post.price = parseFloat(post.price);

    // Thêm trạng thái được format
    post.status_text =
      {
        pending: "Chờ duyệt",
        approved: "Đã duyệt",
        rejected: "Đã từ chối",
        deleted: "Đã xóa",
      }[post.status] || post.status;

    res.json(post);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết bài đăng:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy thông tin bài đăng",
      error: error.message,
    });
  }
});

// API cập nhật bài đăng (cho admin)
app.put("/api/admin/posts/:id", isAuthenticated, isAdmin, async (req, res) => {
  const postId = req.params.id;
  const adminId = req.session.user.id;
  const { title, description, price, location, status, rejection_reason } =
    req.body;

  try {
    // Lấy dữ liệu cũ
    const [oldPostRows] = await db
      .promise()
      .query("SELECT * FROM posts WHERE id = ?", [postId]);
    const oldPost = oldPostRows[0];

    if (!oldPost) {
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    }

    // Cập nhật bài đăng
    await db.promise().query(
      `UPDATE posts 
       SET title = ?, description = ?, price = ?, location = ?, status = ?, rejection_reason = ?, 
           status_update_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title,
        description,
        price,
        location,
        status,
        rejection_reason || null,
        postId,
      ]
    );

    // So sánh để ghi log nếu có thay đổi
    const newPostData = {
      title,
      description,
      price,
      location,
      status,
      rejection_reason: rejection_reason || null,
    };

    const { changedOld, changedNew } = getChangedFields(oldPost, newPostData);
    if (Object.keys(changedOld).length > 0) {
      await logAuditAction(
        adminId,
        "update",
        "post",
        postId,
        changedOld,
        changedNew
      );
    }

    // Gửi thông báo
    const [post] = await db
      .promise()
      .query("SELECT author_id FROM posts WHERE id = ?", [postId]);

    if (post.length > 0) {
      const notificationTitle =
        status === "approved"
          ? "Bài đăng được duyệt"
          : status === "rejected"
          ? "Bài đăng bị từ chối"
          : "Bài đăng được cập nhật";

      const notificationMessage =
        status === "rejected"
          ? `Bài đăng "${title}" đã bị từ chối. Lý do: ${rejection_reason}`
          : `Bài đăng "${title}" của bạn đã được cập nhật`;

      await db.promise().query(
        `INSERT INTO notifications (user_id, title, message, type, post_id) 
         VALUES (?, ?, ?, 'post_approval', ?)`,
        [post[0].author_id, notificationTitle, notificationMessage, postId]
      );
    }

    res.json({ message: "Cập nhật bài đăng thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật bài đăng:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật bài đăng" });
  }
});

// API xóa bài đăng
app.delete(
  "/api/admin/posts/:id",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const postId = req.params.id;
    const adminId = req.session.user.id; // ID của admin thực hiện xóa

    try {
      const connection = await db.promise().getConnection();
      await connection.beginTransaction();

      try {
        // Lấy thông tin bài đăng trước khi xóa (bao gồm tác giả)
        const [postRows] = await connection.query(
          "SELECT p.*, u.id as author_id FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?",
          [postId]
        );

        if (postRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ message: "Không tìm thấy bài đăng" });
        }

        const post = postRows[0];

        // Xóa hình ảnh liên quan
        await connection.query("DELETE FROM post_images WHERE post_id = ?", [
          postId,
        ]);

        // Xóa bài đăng
        await connection.query("DELETE FROM posts WHERE id = ?", [postId]);

        // Ghi log audit
        await logAuditAction(adminId, "delete", "post", postId, post, null);

        // Gửi thông báo cho người đăng bài
        await connection.query(
          `INSERT INTO notifications (user_id, title, message, type, post_id) 
           VALUES (?, ?, ?, 'post_approval', ?)`,
          [
            post.author_id,
            "Bài đăng đã bị xóa",
            `Bài đăng "${post.title}" của bạn đã bị xóa bởi quản trị viên`,
            postId,
          ]
        );

        await connection.commit();
        connection.release();

        res.json({
          success: true,
          message: "Xóa bài đăng thành công",
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error("Lỗi:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa bài đăng",
      });
    }
  }
);

// Route mặc định để phục vụ file login.html
app.get("/", (req, res) => {
  res.redirect("page/login.html");
});

// API: Cập nhật bài đăng
app.put(
  "/api/posts/:id",
  isAuthenticated,
  isUser,
  upload.array("images", 5),
  async (req, res) => {
    const postId = req.params.id;
    const userId = req.session.user.id;
    const { title, description, price, category, location } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!title || !description || !price || !category || !location) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin." });
    }

    // Kiểm tra số lượng ảnh
    if (req.files && req.files.length > 5) {
      return res
        .status(400)
        .json({ message: "Chỉ được tải lên tối đa 5 ảnh." });
    }

    const connection = await db.promise().getConnection();

    try {
      // Kiểm tra quyền sở hữu bài đăng
      const [post] = await connection.query(
        "SELECT id FROM posts WHERE id = ? AND author_id = ?",
        [postId, userId]
      );

      if (post.length === 0) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền chỉnh sửa bài đăng này." });
      }

      // Lấy dữ liệu cũ để ghi log
      const [oldPostRows] = await connection.query(
        "SELECT * FROM posts WHERE id = ?",
        [postId]
      );
      const oldPost = oldPostRows[0];

      if (!oldPost) {
        return res.status(404).json({ message: "Không tìm thấy bài đăng." });
      }

      await connection.beginTransaction();

      // Cập nhật bài đăng
      await connection.query(
        `UPDATE posts 
         SET title = ?, description = ?, price = ?, category_id = ?, location = ?, status = 'pending'
         WHERE id = ?`,
        [title, description, price, category, location, postId]
      );

      // Nếu có ảnh mới, xóa ảnh cũ và thêm ảnh mới
      if (req.files && req.files.length > 0) {
        await connection.query("DELETE FROM post_images WHERE post_id = ?", [
          postId,
        ]);

        const imagePromises = req.files.map((file, index) => {
          if (!file.mimetype.startsWith("image/")) {
            throw new Error("File không phải là hình ảnh");
          }

          const imageRole = index === 0 ? "thumbnail" : "image";
          return connection.query(
            "INSERT INTO post_images (post_id, image_data, image_type, image_role) VALUES (?, ?, ?, ?)",
            [postId, file.buffer, file.mimetype, imageRole]
          );
        });

        await Promise.all(imagePromises);
      }

      await connection.commit();

      // So sánh và chỉ log các trường thay đổi
      const newPostData = {
        title,
        description,
        price,
        category_id: parseInt(category),
        location,
        status: "pending",
      };

      const { changedOld, changedNew } = getChangedFields(oldPost, newPostData);

      if (Object.keys(changedOld).length > 0) {
        await logAuditAction(
          userId,
          "update",
          "post",
          postId,
          changedOld,
          changedNew
        );
      }

      res.json({ message: "Cập nhật bài đăng thành công!" });
    } catch (error) {
      await connection.rollback();
      console.error("Lỗi khi cập nhật bài đăng:", error);
      res.status(500).json({
        message: "Lỗi server.",
        error: error.message,
      });
    } finally {
      connection.release();
    }
  }
);

// API: Lấy danh sách thông báo của người dùng hiện tại
app.get("/api/notifications", isAuthenticated, async (req, res) => {
  try {
    const [notifications] = await db.promise().query(
      `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 50`,
      [req.session.user.id]
    );

    // Format thời gian cho từng thông báo
    notifications.forEach((notification) => {
      notification.created_at = new Date(
        notification.created_at
      ).toLocaleString("vi-VN");
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
    });
  }
});

// API: Đánh dấu một thông báo đã đọc
app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
  try {
    await db.promise().query(
      `UPDATE notifications 
             SET is_read = TRUE 
             WHERE id = ? AND user_id = ?`,
      [req.params.id, req.session.user.id]
    );

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notification",
    });
  }
});

// API: Đánh dấu tất cả thông báo đã đọc
app.put(
  "/api/notifications/mark-all-read",
  isAuthenticated,
  async (req, res) => {
    try {
      await db.promise().query(
        `UPDATE notifications 
             SET is_read = TRUE 
             WHERE user_id = ?`,
        [req.session.user.id]
      );

      res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        message: "Error updating notifications",
      });
    }
  }
);

// API: Cập nhật trạng thái đã bán
app.put("/api/posts/:id/sold", isAuthenticated, isUser, async (req, res) => {
  const postId = req.params.id;
  const userId = req.session.user.id;

  try {
    // Kiểm tra quyền sở hữu bài đăng
    const [post] = await db
      .promise()
      .query("SELECT id FROM posts WHERE id = ? AND author_id = ?", [
        postId,
        userId,
      ]);

    if (post.length === 0) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền cập nhật bài đăng này." });
    }

    // Cập nhật trạng thái availability thành sold
    await db
      .promise()
      .query("UPDATE posts SET availability = 'sold' WHERE id = ?", [postId]);

    res.json({ message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái bài đăng:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái" });
  }
});

async function logAuditAction(
  userId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue
) {
  try {
    await db.promise().query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
      ]
    );
  } catch (err) {
    console.error("Lỗi ghi audit log:", err);
  }
}

/**
 * Hàm lấy các trường bị thay đổi giữa hai object
 * @param {Object} oldObj - Dữ liệu cũ
 * @param {Object} newObj - Dữ liệu mới
 * @returns {Object} - Các trường bị thay đổi
 */
function getChangedFields(oldObj, newObj) {
  const changedOld = {};
  const changedNew = {};
  for (const key in newObj) {
    if (oldObj[key] !== newObj[key]) {
      changedOld[key] = oldObj[key];
      changedNew[key] = newObj[key];
    }
  }
  return { changedOld, changedNew };
}

app.post("/api/posts", isAuthenticated, isUser, async (req, res) => {
  const { title, description, price, category, location } = req.body;
  const userId = req.session.user.id;

  try {
    const [result] = await db.promise().query(
      `INSERT INTO posts (title, description, price, category_id, location, author_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [title, description, price, category, location, userId]
    );

    const postId = result.insertId;

    // Ghi log tạo bài đăng
    await logAuditAction(userId, "create", "post", postId, null, {
      title,
      description,
      price,
      category,
      location,
      status: "pending",
    });

    res.status(201).json({ message: "Bài đăng đã được tạo thành công!" });
  } catch (error) {
    console.error("Lỗi khi tạo bài đăng:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
});

// API thống kê số lượng sản phẩm theo ngày/tuần/tháng và trạng thái
// ...existing code...
// ...existing code...
app.get(
  "/api/admin/reports/posts",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const { range = "month", status = "all", category = "all" } = req.query;

    let sql, labels, xLabel;

    try {
      // 1. Chuẩn bị cấu trúc dữ liệu và nhãn tùy theo range
      if (range === "day") {
        xLabel = "Giờ";
        labels = Array.from(
          { length: 24 },
          (_, h) => (h < 10 ? "0" : "") + h + ":00"
        );

        // SQL cho thống kê theo giờ trong ngày
        let whereClause = "DATE(created_at) = CURDATE()";

        if (status !== "all") {
          whereClause += ` AND status = ${mysql.escape(status)}`;
        }

        if (category !== "all") {
          whereClause += ` AND category_id = ${mysql.escape(category)}`;
        }

        sql = `
          SELECT 
            HOUR(created_at) as hour,
            COUNT(*) as count
          FROM posts
          WHERE ${whereClause}
          GROUP BY HOUR(created_at)
        `;

        // Lấy kết quả và map vào mảng
        const [rows] = await db.promise().query(sql);
        const counts = Array(24).fill(0);
        rows.forEach((row) => {
          counts[row.hour] = Number(row.count);
        });

        res.json({
          labels,
          counts,
          xLabel,
        });
      } else if (range === "week") {
        xLabel = "Ngày";

        // Lấy 7 ngày gần nhất
        let whereClause = "created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";

        if (status !== "all") {
          whereClause += ` AND status = ${mysql.escape(status)}`;
        }

        if (category !== "all") {
          whereClause += ` AND category_id = ${mysql.escape(category)}`;
        }

        const [weekData] = await db.promise().query(`
          SELECT 
            DATE_FORMAT(created_at, '%d/%m') as day,
            COUNT(*) as count
          FROM posts
          WHERE ${whereClause}
          GROUP BY DATE_FORMAT(created_at, '%d/%m')
          ORDER BY MIN(created_at)
        `);

        // Tạo labels cho 7 ngày
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);

        labels = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          labels.push(
            d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
          );
        }

        // Map dữ liệu vào mảng ngày
        const counts = Array(7).fill(0);
        const dayMap = {};
        weekData.forEach((row) => {
          dayMap[row.day] = Number(row.count);
        });

        labels.forEach((day, i) => {
          const [d, m] = day.split("/");
          const shortDay = `${d}/${m}`;
          if (dayMap[shortDay]) {
            counts[i] = dayMap[shortDay];
          }
        });

        res.json({
          labels,
          counts,
          xLabel,
        });
      } else {
        // month
        xLabel = "Ngày";

        // Lấy ngày đầu tiên của tháng
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();

        labels = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          return (
            (day < 10 ? "0" : "") +
            day +
            "/" +
            (today.getMonth() + 1 < 10 ? "0" : "") +
            (today.getMonth() + 1)
          );
        });

        // Lấy dữ liệu cho tháng hiện tại
        let whereClause = `
          created_at >= '${firstDay.toISOString().split("T")[0]}' 
          AND created_at <= '${lastDay.toISOString().split("T")[0]} 23:59:59'
        `;

        if (status !== "all") {
          whereClause += ` AND status = ${mysql.escape(status)}`;
        }

        if (category !== "all") {
          whereClause += ` AND category_id = ${mysql.escape(category)}`;
        }

        const [monthData] = await db.promise().query(`
          SELECT 
            DATE_FORMAT(created_at, '%d/%m') as day,
            COUNT(*) as count
          FROM posts
          WHERE ${whereClause}
          GROUP BY DATE_FORMAT(created_at, '%d/%m')
          ORDER BY MIN(created_at)
        `);

        // Map dữ liệu vào mảng ngày
        const counts = Array(daysInMonth).fill(0);
        const dayMap = {};
        monthData.forEach((row) => {
          dayMap[row.day] = Number(row.count);
        });

        labels.forEach((day, i) => {
          if (dayMap[day]) {
            counts[i] = dayMap[day];
          }
        });

        res.json({
          labels,
          counts,
          xLabel,
        });
      }
    } catch (err) {
      console.error("Lỗi server khi thống kê:", err);
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  }
);

// API để lấy danh sách các danh mục
app.get("/api/categories", async (req, res) => {
  try {
    const [categories] = await db
      .promise()
      .query("SELECT id, name FROM categories ORDER BY name");
    res.json(categories);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách danh mục:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// API thống kê sản phẩm của một hoạt động
app.get(
  "/api/admin/reports/activities",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const { activityId } = req.query;

    if (!activityId) {
      return res.status(400).json({ message: "Thiếu ID hoạt động" });
    }

    try {
      // Lấy thông tin hoạt động (thời gian bắt đầu, kết thúc)
      const [activityRows] = await db
        .promise()
        .query(
          `SELECT title, start_date, end_date FROM activities WHERE id = ?`,
          [activityId]
        );

      if (activityRows.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy hoạt động" });
      }

      const activity = activityRows[0];

      // Lấy danh sách các sản phẩm (items) của hoạt động
      const [itemsRows] = await db
        .promise()
        .query(
          `SELECT name, quantity_needed, quantity_received FROM activity_items WHERE activity_id = ?`,
          [activityId]
        );

      // Format dữ liệu cho biểu đồ
      const labels = itemsRows.map((item) => item.name);
      const neededData = itemsRows.map((item) => item.quantity_needed);
      const receivedData = itemsRows.map((item) => item.quantity_received);

      // Tính tỷ lệ nhận được so với cần
      const percentageData = itemsRows.map((item) =>
        item.quantity_needed > 0
          ? Math.round((item.quantity_received / item.quantity_needed) * 100)
          : 0
      );

      res.json({
        activity,
        labels,
        datasets: {
          needed: neededData,
          received: receivedData,
          percentage: percentageData,
        },
      });
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu thống kê hoạt động:", err);
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  }
);

// API lấy danh sách tất cả hoạt động (cho dropdown)
app.get(
  "/api/admin/reports/activities/list",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const [activities] = await db
        .promise()
        .query(
          `SELECT id, title, start_date, end_date FROM activities ORDER BY start_date DESC`
        );

      res.json(activities);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách hoạt động:", err);
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  }
);

// API thống kê sản phẩm của một hoạt động
app.get(
  "/api/admin/reports/activities",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const { activityId } = req.query;

    if (!activityId) {
      return res.status(400).json({ message: "Thiếu ID hoạt động" });
    }

    try {
      // Lấy thông tin hoạt động (thời gian bắt đầu, kết thúc)
      const [activityRows] = await db
        .promise()
        .query(
          `SELECT title, start_date, end_date FROM activities WHERE id = ?`,
          [activityId]
        );

      if (activityRows.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy hoạt động" });
      }

      const activity = activityRows[0];

      // Lấy danh sách các sản phẩm (items) của hoạt động
      const [itemsRows] = await db
        .promise()
        .query(
          `SELECT name, quantity_needed, quantity_received FROM activity_items WHERE activity_id = ?`,
          [activityId]
        );

      // Format dữ liệu cho biểu đồ
      const labels = itemsRows.map((item) => item.name);
      const neededData = itemsRows.map((item) => item.quantity_needed);
      const receivedData = itemsRows.map((item) => item.quantity_received);

      // Tính tỷ lệ nhận được so với cần
      const percentageData = itemsRows.map((item) =>
        item.quantity_needed > 0
          ? Math.round((item.quantity_received / item.quantity_needed) * 100)
          : 0
      );

      res.json({
        activity,
        labels,
        datasets: {
          needed: neededData,
          received: receivedData,
          percentage: percentageData,
        },
      });
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu thống kê hoạt động:", err);
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  }
);

// API lấy danh sách tất cả hoạt động (cho dropdown)
app.get(
  "/api/admin/reports/activities/list",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const [activities] = await db
        .promise()
        .query(
          `SELECT id, title, start_date, end_date FROM activities ORDER BY start_date DESC`
        );

      res.json(activities);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách hoạt động:", err);
      res.status(500).json({ message: "Lỗi server", error: err.message });
    }
  }
);

// API xuất dữ liệu dạng CSV
app.post("/api/admin/export", isAuthenticated, isAdmin, async (req, res) => {
  const { table, startDate, endDate } = req.body;

  // Kiểm tra table name hợp lệ để tránh SQL injection
  const validTables = [
    "users",
    "posts",
    "activities",
    "activity_items",
    "notifications",
    "audit_logs",
  ];
  if (!validTables.includes(table)) {
    return res.status(400).json({ message: "Bảng không hợp lệ" });
  }

  try {
    // Xây dựng câu query dựa trên loại bảng
    let query = "";
    switch (table) {
      case "users":
        query = `
          SELECT id, username, email, full_name, phone, address, school, 
                 role_id, status, created_at, updated_at
          FROM users 
          WHERE created_at BETWEEN ? AND ?
        `;
        break;

      case "posts":
        query = `
          SELECT p.id, p.title, p.description, p.price, c.name as category,
                 p.location, u.username as author, p.status, p.availability,
                 p.created_at, p.updated_at
          FROM posts p
          JOIN users u ON p.author_id = u.id
          JOIN categories c ON p.category_id = c.id
          WHERE p.created_at BETWEEN ? AND ?
        `;
        break;

      case "activities":
        query = `
          SELECT a.id, a.title, a.description, a.start_date, a.end_date,
                 a.location, u.username as organizer, a.name_organizer,
                 a.status, a.created_at, a.updated_at 
          FROM activities a
          JOIN users u ON a.organizer_id = u.id
          WHERE a.created_at BETWEEN ? AND ?
        `;
        break;

      case "activity_items":
        query = `
          SELECT ai.id, a.title as activity_name, ai.name, ai.description,
                 ai.quantity_needed, ai.quantity_received, ai.created_at
          FROM activity_items ai
          JOIN activities a ON ai.activity_id = a.id
          WHERE ai.created_at BETWEEN ? AND ?
        `;
        break;

      case "notifications":
        query = `
          SELECT n.id, u.username as user, n.title, n.message, 
                 n.type, n.is_read, n.created_at
          FROM notifications n
          JOIN users u ON n.user_id = u.id
          WHERE n.created_at BETWEEN ? AND ?
        `;
        break;

      case "audit_logs":
        query = `
          SELECT al.id, u.username as user, al.action, al.entity_type,
                 al.entity_id, al.old_value, al.new_value, al.created_at
          FROM audit_logs al
          LEFT JOIN users u ON al.user_id = u.id
          WHERE al.created_at BETWEEN ? AND ?
        `;
        break;
    }

    // Thực hiện query
    const [rows] = await db.promise().query(query, [startDate, endDate]);

    // Convert to CSV
    const csvFields = Object.keys(rows[0] || {});
    const csvRows = rows.map((row) =>
      csvFields
        .map((field) => {
          let value = row[field];
          // Format dates
          if (value instanceof Date) {
            value = value.toLocaleString("vi-VN");
          }
          // Escape special characters
          if (typeof value === "string") {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",")
    );

    let csv = [csvFields.join(","), ...csvRows].join("\r\n"); // 1) Dùng CRLF cho line breaks

    // 2) Thêm BOM vào đầu file
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const csvBuffer = Buffer.concat([bom, Buffer.from(csv, "utf8")]);

    // 3) Set header kèm charset
    res.setHeader("Content-Type", "text/csv; charset=UTF-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${table}_${startDate}_${endDate}.csv`
    );

    // 4) Gửi buffer thẳng cho client
    res.send(csvBuffer);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xuất dữ liệu",
      error: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

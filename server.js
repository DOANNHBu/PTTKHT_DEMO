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
    "default-src 'self'; script-src 'self' 'unsafe-inline' http://localhost:35729; img-src 'self' data:; connect-src 'self' ws://localhost:35729/livereload;"
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
  connection.release(); // Don't forget to release the connection
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
app.get("/api/posts", isAuthenticated, isUser, (req, res) => {
  const query = `
    SELECT 
      p.id, 
      p.title, 
      p.price, 
      p.location, 
      p.created_at, 
      c.name AS categoryName, 
      (SELECT image_data FROM post_images WHERE post_id = p.id AND image_role = 'thumbnail' LIMIT 1) AS thumbnail
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

    // Chuyển đổi ảnh từ buffer sang base64
    results.forEach((post) => {
      if (post.thumbnail) {
        post.thumbnail = `data:image/jpeg;base64,${post.thumbnail.toString(
          "base64"
        )}`;
      }
    });

    res.json(results);
  });
});

// API: Lấy chi tiết một bài đăng và hình ảnh của nó
app.get("/api/posts/:id", isAuthenticated, isUser, (req, res) => {
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

  const imagesQuery = `
    SELECT image_data, image_role
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

      // Chuyển đổi ảnh từ buffer sang base64
      post.images = imageResults.map((img) => ({
        role: img.image_role,
        data: `data:image/jpeg;base64,${img.image_data.toString("base64")}`,
      }));

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
app.post("/api/posts", isAuthenticated, isUser, upload.none(), (req, res) => {
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

// 4. Cập nhật trạng thái bài đăng
app.put("/api/admin/posts/:id/status", isAuthenticated, isAdmin, (req, res) => {
  const { status, rejection_reason } = req.body;
  const postId = req.params.id;

  const query = `
    UPDATE posts 
    SET status = ?, rejection_reason = ?
    WHERE id = ?
  `;

  db.query(query, [status, rejection_reason, postId], (err, result) => {
    if (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      return res.status(500).json({ message: "Lỗi server" });
    }
    res.json({ message: "Cập nhật thành công" });
  });
});

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

      await connection.commit();
      res.json({ id: activityId, ...activity });
    } catch (error) {
      await connection.rollback();
      console.error("Error creating activity:", error);
      res.status(500).json({ message: "Lỗi khi tạo hoạt động" });
    } finally {
      connection.release();
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
app.put(
  "/api/admin/activity-items/:id",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    const itemId = req.params.id;
    const { quantity_received } = req.body;

    try {
      // Kiểm tra và cập nhật số lượng
      const [item] = await db
        .promise()
        .query("SELECT quantity_needed FROM activity_items WHERE id = ?", [
          itemId,
        ]);

      if (item.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy vật phẩm" });
      }

      if (quantity_received < 0) {
        return res.status(400).json({ message: "Số lượng không hợp lệ" });
      }

      await db
        .promise()
        .query("UPDATE activity_items SET quantity_received = ? WHERE id = ?", [
          quantity_received,
          itemId,
        ]);

      res.json({ message: "Cập nhật thành công" });
    } catch (error) {
      console.error("Error updating item quantity:", error);
      res.status(500).json({ message: "Lỗi khi cập nhật số lượng" });
    }
  }
);

// API để cập nhật hoạt động
app.put("/api/admin/activities/:id", isAuthenticated, isAdmin, (req, res) => {
  const activityId = req.params.id;
  const activity = { ...req.body };
  const items = activity.items || [];

  // Remove fields that shouldn't be in the UPDATE query
  delete activity.items;
  delete activity.id;
  delete activity.created_at;
  delete activity.updated_at;
  delete activity.organizer_name;
  // Don't delete name_organizer as it's required

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi kết nối database",
        error: err.message,
      });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Error starting transaction:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi khi bắt đầu transaction",
          error: err.message,
        });
      }

      // Update activity
      connection.query(
        "UPDATE activities SET ? WHERE id = ?",
        [activity, activityId],
        (error) => {
          if (error) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error updating activity:", error);
              res.status(500).json({
                success: false,
                message: "Lỗi khi cập nhật hoạt động",
                error: error.message,
              });
            });
          }

          // Delete old items
          connection.query(
            "DELETE FROM activity_items WHERE activity_id = ?",
            [activityId],
            (error) => {
              if (error) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Error deleting old items:", error);
                  res.status(500).json({
                    success: false,
                    message: "Lỗi khi xóa vật phẩm cũ",
                    error: error.message,
                  });
                });
              }

              // Insert new items if any exist
              if (items.length > 0) {
                const values = items.map((item) => [
                  activityId,
                  item.name,
                  item.description || "",
                  parseInt(item.quantity_needed) || 0,
                  parseInt(item.quantity_received) || 0,
                ]);

                const itemQuery =
                  "INSERT INTO activity_items (activity_id, name, description, quantity_needed, quantity_received) VALUES ?";

                connection.query(itemQuery, [values], (error) => {
                  if (error) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Error inserting new items:", error);
                      res.status(500).json({
                        success: false,
                        message: "Lỗi khi thêm vật phẩm mới",
                        error: error.message,
                      });
                    });
                  }

                  connection.commit((err) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({
                          success: false,
                          message: "Lỗi khi commit transaction",
                          error: err.message,
                        });
                      });
                    }

                    connection.release();
                    res.json({
                      success: true,
                      message: "Cập nhật hoạt động thành công",
                      id: activityId,
                    });
                  });
                });
              } else {
                // If no items to insert, commit directly
                connection.commit((err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      res.status(500).json({
                        success: false,
                        message: "Lỗi khi commit transaction",
                        error: err.message,
                      });
                    });
                  }

                  connection.release();
                  res.json({
                    success: true,
                    message: "Cập nhật hoạt động thành công",
                    id: activityId,
                  });
                });
              }
            }
          );
        }
      );
    });
  });
});

// API để xóa hoạt động
app.delete(
  "/api/admin/activities/:id",
  isAuthenticated,
  isAdmin,
  (req, res) => {
    const activityId = req.params.id;

    // Get connection from pool
    db.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi kết nối database",
          error: err.message,
        });
      }

      // Begin transaction
      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          console.error("Error starting transaction:", err);
          return res.status(500).json({
            success: false,
            message: "Lỗi khi bắt đầu transaction",
            error: err.message,
          });
        }

        // Delete activity items first
        connection.query(
          "DELETE FROM activity_items WHERE activity_id = ?",
          [activityId],
          (error) => {
            if (error) {
              return connection.rollback(() => {
                connection.release();
                console.error("Error deleting activity items:", error);
                res.status(500).json({
                  success: false,
                  message: "Lỗi khi xóa vật phẩm của hoạt động",
                  error: error.message,
                });
              });
            }

            // Then delete the activity
            connection.query(
              "DELETE FROM activities WHERE id = ?",
              [activityId],
              (error) => {
                if (error) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Error deleting activity:", error);
                    res.status(500).json({
                      success: false,
                      message: "Lỗi khi xóa hoạt động",
                      error: error.message,
                    });
                  });
                }

                // Commit transaction
                connection.commit((err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      res.status(500).json({
                        success: false,
                        message: "Lỗi khi commit transaction",
                        error: err.message,
                      });
                    });
                  }

                  connection.release();
                  res.json({
                    success: true,
                    message: "Xóa hoạt động thành công",
                  });
                });
              }
            );
          }
        );
      });
    });
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

// Route mặc định để phục vụ file login.html
app.get("/", (req, res) => {
  res.redirect("page/login.html");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

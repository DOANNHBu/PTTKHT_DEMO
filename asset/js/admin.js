// Kiểm tra đăng nhập admin
function checkAdminAuth() {
  fetch("/api/auth/status")
    .then((response) => response.json())
    .then((data) => {
      if (!data.authenticated || data.user.role_id !== 1) {
        window.location.href = "/page/login.html";
        return false;
      }
    })
    .catch((error) => {
      console.error("Lỗi kiểm tra auth:", error);
      window.location.href = "/page/login.html";
    });
  return true;
}

// Load nội dung cho từng section
function loadContent(section) {
  const contentArea = document.getElementById("content-area");
  switch (section) {
    case "users":
      loadUserManagement();
      break;
    case "posts":
      loadPostApproval();
      break;
    case "activities":
      loadActivityManagement();
      break;
    case "reports":
      loadReports();
      break;
    default:
      loadDashboard();
  }
}

// Quản lý tài khoản
function loadUserManagement() {
  fetch("/api/admin/users", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((users) => {
      const content = `
            <div class="card">
                <h2>Quản lý tài khoản</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Tên đăng nhập</th>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users
                          .map(
                            (user) => `
                            <tr>
                                <td>${user.username}</td>
                                <td>${user.full_name}</td>
                                <td>${user.email}</td>
                                <td>${user.role_name}</td>
                                <td>${formatUserStatus(user.status)}</td>
                                <td>
                                    <button onclick="toggleUserStatus('${
                                      user.id
                                    }', '${user.status}')">
                                        ${
                                          user.status === "active"
                                            ? "Khóa"
                                            : "Mở khóa"
                                        }
                                    </button>
                                </td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
      document.getElementById("content-area").innerHTML = content;
    });
}

// Duyệt bài đăng
function loadPostApproval() {
  fetch("/api/admin/posts", {
    credentials: "include",
  })
    .then((response) => response.json())
    .then((posts) => {
      const content = `
            <div class="card">
                <h2>Duyệt bài đăng</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Tiêu đề</th>
                            <th>Người đăng</th>
                            <th>Danh mục</th>
                            <th>Ngày đăng</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${posts
                          .map(
                            (post) => `
                            <tr>
                                <td>${post.title}</td>
                                <td>${post.author_name}</td>
                                <td>${post.category_name}</td>
                                <td>${formatDate(post.created_at)}</td>
                                <td>${formatPostStatus(post.status)}</td>
                                <td>
                                    <button onclick="viewPost('${
                                      post.id
                                    }')">Xem</button>
                                    ${
                                      post.status === "pending"
                                        ? `
                                        <button onclick="approvePost('${post.id}')">Duyệt</button>
                                        <button onclick="rejectPost('${post.id}')">Từ chối</button>
                                    `
                                        : ""
                                    }
                                </td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
      document.getElementById("content-area").innerHTML = content;
    });
}

// Thay đổi hàm loadActivityManagement()
function loadActivityManagement() {
  // Load nội dung từ file activities.html
  fetch("/page/activities_ad.html")
    .then((response) => response.text())
    .then((html) => {
      const contentArea = document.getElementById("content-area");
      contentArea.innerHTML = html;

      // Khởi tạo ActivityManager sau khi load HTML
      if (typeof activityManager === "undefined") {
        window.activityManager = new ActivityManager();
      }
      activityManager.loadActivities();
    })
    .catch((error) => {
      console.error("Error loading activities page:", error);
      document.getElementById("content-area").innerHTML =
        '<div class="error">Không thể tải trang quản lý hoạt động</div>';
    });
}

// Báo cáo thống kê
function loadReports() {
  const content = `
        <div class="card">
            <h2>Báo cáo thống kê</h2>
            <div class="report-filters">
                <div class="form-group">
                    <label>Loại báo cáo</label>
                    <select class="form-control">
                        <option>Báo cáo hoạt động</option>
                        <option>Báo cáo giao dịch</option>
                        <option>Báo cáo quyên góp</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Từ ngày</label>
                    <input type="date" class="form-control">
                </div>
                <div class="form-group">
                    <label>Đến ngày</label>
                    <input type="date" class="form-control">
                </div>
                <button class="btn btn-primary">Xem báo cáo</button>
            </div>
            <div id="report-content">
                <!-- Report content will be loaded here -->
            </div>
        </div>
    `;
  document.getElementById("content-area").innerHTML = content;
}

// Các hàm hỗ trợ
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("vi-VN");
}

function formatUserStatus(status) {
  const statusMap = {
    active: "Hoạt động",
    locked: "Đã khóa",
    deleted: "Đã xóa",
  };
  return statusMap[status] || status;
}

function formatPostStatus(status) {
  const statusMap = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    deleted: "Đã xóa",
  };
  return statusMap[status] || status;
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  if (!checkAdminAuth()) return;

  // Handle navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      if (this.id === "logout") {
        handleLogout();
        return;
      }
      const section = this.getAttribute("href").substring(1);
      loadContent(section);

      // Update active state
      document
        .querySelectorAll(".nav-item")
        .forEach((i) => i.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Load default content
  loadContent("dashboard");
});

// Thêm hàm xử lý đăng xuất
function handleLogout() {
  if (!confirm("Bạn có chắc muốn đăng xuất?")) return;

  fetch("/api/logout", {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      // nếu logout thành công, chuyển về login
      window.location.href = "/page/login.html";
    })
    .catch((err) => {
      console.error("Lỗi khi gọi API logout:", err);
      // Dù lỗi, vẫn redirect để tránh kẹt
      window.location.href = "/page/login.html";
    });
}

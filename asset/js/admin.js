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
                <div class="card-header">
                    <h2>Quản lý tài khoản</h2>
                    <button class="btn btn-primary" onclick="showCreateUserModal()">Tạo tài khoản</button>
                </div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Tên đăng nhập</th>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Trường</th>
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
                                <td>${user.school || ''}</td>
                                <td>
<<<<<<< HEAD
                                    <button onclick="toggleUserStatus('${
                                      user.id
                                    }', '${user.status}')">
                                        ${
                                          user.status === "active"
                                            ? "Khóa"
                                            : "Mở khóa"
                                        }
=======
                                    <button class="btn btn-danger" onclick="deleteUser(${user.id})">
                                        Xóa
>>>>>>> hlink
                                    </button>
                                </td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>

            <!-- Thêm modal vào đây -->
            <div id="createUserModal" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="closeCreateUserModal()">&times;</span>
                    <h2>Tạo tài khoản mới</h2>
                    <form id="createUserForm" onsubmit="createUser(event)">
                        <div class="form-group">
                            <label>Tên đăng nhập:</label>
                            <input type="text" name="username" required>
                        </div>
                        <div class="form-group">
                            <label>Mật khẩu:</label>
                            <input type="password" name="password" required>
                        </div>
                        <div class="form-group">
                            <label>Email:</label>
                            <input type="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label>Họ và tên:</label>
                            <input type="text" name="full_name" required>
                        </div>
                        <div class="form-group">
                            <label>Số điện thoại:</label>
                            <input type="tel" name="phone">
                        </div>
                        <div class="form-group">
                            <label>Địa chỉ:</label>
                            <input type="text" name="address">
                        </div>
                        <div class="form-group">
                            <label>Trường:</label>
                            <input type="text" name="school">
                        </div>
                        <div class="form-group">
                            <label>Avatar:</label>
                            <input type="file" name="avatar" accept="image/*">
                        </div>
                        <div class="form-group">
                            <label>Vai trò:</label>
                            <select name="role_id" required>
                                <option value="1">Admin</option>
                                <option value="2">User</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Tạo tài khoản</button>
                    </form>
                </div>
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
<<<<<<< HEAD
    .catch((err) => {
      console.error("Lỗi khi gọi API logout:", err);
      // Dù lỗi, vẫn redirect để tránh kẹt
      window.location.href = "/page/login.html";
    });
}
=======
        .then(res => res.json())
        .then(data => {
            // nếu logout thành công, chuyển về login
            window.location.href = '/page/login.html';
        })
        .catch(err => {
            console.error('Lỗi khi gọi API logout:', err);
            // Dù lỗi, vẫn redirect để tránh kẹt
            window.location.href = '/page/login.html';
        });
}

// Thêm các hàm xử lý modal và tạo tài khoản
function showCreateUserModal() {
    const modal = document.getElementById('createUserModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeCreateUserModal() {
    const modal = document.getElementById('createUserModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function createUser(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
            alert('Tạo tài khoản thành công!');
            closeCreateUserModal();
            loadUserManagement(); // Tải lại danh sách người dùng
        } else {
            alert(result.message || 'Lỗi khi tạo tài khoản');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Đã xảy ra lỗi khi tạo tài khoản');
    }
}

// Thêm hàm xóa người dùng
async function deleteUser(userId) {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }

        // Tải lại danh sách người dùng
        loadUserManagement();
        alert('Đã xóa tài khoản thành công');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Không thể xóa tài khoản');
    }
}
>>>>>>> hlink

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

// Cập nhật hàm loadUserManagement()
function loadUserManagement() {
  const content = `
        <div class="user-management">
            <div class="card">
                <div class="card-header">
                    <h2>Quản lý tài khoản</h2>
                    <button class="btn btn-primary" onclick="userManager.showCreateModal()">Tạo tài khoản</button>
                </div>
                
                <div class="tabs">
                    <button class="tab active" data-role="2">Người dùng</button>
                    <button class="tab" data-role="1">Admin</button>
                </div>

                <div class="search-bar">
                    <input type="text" id="searchUsername" placeholder="Tìm kiếm theo tên đăng nhập hoặc họ tên...">
                </div>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên đăng nhập</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>Trường</th>
                                <th>Vai trò</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="users-table">
                            <!-- Dữ liệu người dùng sẽ được thêm vào đây bởi JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal tạo tài khoản mới -->
            <div id="createUserModal" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="userManager.closeCreateModal()">&times;</span>
                    <h2>Tạo tài khoản mới</h2>
                    <form id="createUserForm" onsubmit="userManager.handleCreate(event)">
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
                                <option value="2" selected>User</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Tạo tài khoản</button>
                    </form>
                </div>
            </div>
        </div>
    `;

  document.getElementById("content-area").innerHTML = content;

  // Khởi tạo UserManager nếu chưa tồn tại
  if (typeof window.userManager === "undefined") {
    window.userManager = new UserManager();
  } else {
    // Nếu đã tồn tại, tải lại danh sách người dùng
    window.userManager.loadUsers();
  }

  // Thêm event listener cho việc click bên ngoài modal
  const createModal = document.getElementById("createUserModal");
  window.onclick = function (event) {
    if (event.target == createModal) {
      userManager.closeCreateModal();
    }
  };
}

// Duyệt bài đăng
function loadPostApproval() {
  const content = `
        <div class="post-approval">
            <div class="card">
                <h2>Quản lý bài đăng</h2>
                
                <!-- Thêm phần controls -->
                <div class="post-controls">
                    <div class="filter-group">
                        <select id="statusFilter" class="form-control">
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Đã từ chối</option>
                        </select>
                    </div>
                    <div class="search-group">
                        <input type="text" id="searchPost" class="form-control" 
                            placeholder="Tìm kiếm theo tiêu đề hoặc người đăng...">
                    </div>
                </div>

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
                    <tbody id="posts-table">
                        <!-- Dữ liệu sẽ được thêm vào đây -->
                    </tbody>
                </table>
            </div>
            
            <!-- Modal xem chi tiết bài đăng -->
            <div id="postDetailModal" class="post-detail-modal">
                <!-- Nội dung modal sẽ được thêm động -->
            </div>
        </div>
    `;
  document.getElementById("content-area").innerHTML = content;

  // Khởi tạo PostApproval nếu chưa tồn tại
  if (typeof window.postApproval === "undefined") {
    window.postApproval = new PostApproval();
  }
  postApproval.loadPendingPosts();
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
  const content = `placehoder for reports content`;
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

// Thay thế hàm handleLogout hiện tại bằng hàm này
function handleLogout() {
  if (!confirm("Bạn có chắc muốn đăng xuất?")) return;

  fetch("/api/logout", {
    method: "GET",
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      // Xóa các interval và timeout đang chạy
      for (let i = 1; i < 99999; i++) {
        window.clearInterval(i);
        window.clearTimeout(i);
      }

      // Xóa các dữ liệu lưu trữ
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("userRole");
      sessionStorage.removeItem("isAdminAuthenticated");

      // Chuyển hướng về trang login
      window.location.replace("/page/login.html");
    })
    .catch((err) => {
      console.error("Lỗi khi gọi API logout:", err);
      // Trong trường hợp lỗi, vẫn thực hiện cleanup và chuyển hướng
      for (let i = 1; i < 99999; i++) {
        window.clearInterval(i);
        window.clearTimeout(i);
      }
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("userRole");
      sessionStorage.removeItem("isAdminAuthenticated");
      window.location.replace("/page/login.html");
    });
}

// Thêm các hàm xử lý modal và tạo tài khoản
function showCreateUserModal() {
  const modal = document.getElementById("createUserModal");
  if (modal) {
    modal.style.display = "block";
  }
}

function closeCreateUserModal() {
  const modal = document.getElementById("createUserModal");
  if (modal) {
    modal.style.display = "none";
  }
}

async function createUser(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  try {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok) {
      alert("Tạo tài khoản thành công!");
      closeCreateUserModal();
      loadUserManagement(); // Tải lại danh sách người dùng
    } else {
      alert(result.message || "Lỗi khi tạo tài khoản");
    }
  } catch (error) {
    console.error("Lỗi:", error);
    alert("Đã xảy ra lỗi khi tạo tài khoản");
  }
}

// Thêm hàm xóa người dùng
async function deleteUser(userId) {
  if (!confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete user");
    }

    // Tải lại danh sách người dùng
    loadUserManagement();
    alert("Đã xóa tài khoản thành công");
  } catch (error) {
    console.error("Error deleting user:", error);
    alert("Không thể xóa tài khoản");
  }
}

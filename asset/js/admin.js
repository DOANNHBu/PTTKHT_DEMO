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

function loadDashboard() {
  document.getElementById("content-area").innerHTML = `
    <div class="dashboard-welcome">
      <h2>Chào mừng đến với trang quản trị!</h2>
      <p>Chọn chức năng ở menu bên trái để quản lý hệ thống.</p>
    </div>
  `;
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
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal tạo tài khoản mới -->
            <div id="createUserModal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
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
                                <option value="2">User</option>
                                <option value="1">Admin</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Tạo tài khoản</button>
                    </form>
                </div>
            </div>
        </div>
    `;

  document.getElementById("content-area").innerHTML = content;

  // Đảm bảo chỉ tạo một instance mới nếu chưa tồn tại
  if (!window.userManager) {
    window.userManager = new UserManager();
    window.userManager.initialize();
  } else {
    // Nếu đã tồn tại instance, chỉ cần tái khởi tạo
    window.userManager.reinitialize();
  }
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
// ...existing code...
// ...existing code...
function loadReports() {
  const content = `
    <div class="reports-container">
      <!-- Thống kê số lượng sản phẩm -->
      <div class="report-section">
        <h2>Thống kê số lượng sản phẩm</h2>
        <div class="report-controls">
          <label>Khoảng thời gian:
            <select id="report-range">
              <option value="day">1 ngày</option>
              <option value="week">1 tuần</option>
              <option value="month" selected>1 tháng</option>
            </select>
          </label>
          <label>Trạng thái:
            <select id="report-status">
              <option value="all">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </label>
          <label>Danh mục:
            <select id="report-category">
              <option value="all">Tất cả</option>
              <!-- Danh sách danh mục sẽ được thêm vào đây -->
            </select>
          </label>
        </div>
        <canvas id="reportChart" height="80"></canvas>
      </div>
      
      <!-- Thống kê hoạt động -->
      <div class="report-section">
        <h2>Thống kê sản phẩm theo hoạt động</h2>
        <div class="report-controls">
          <label>Hoạt động:
            <select id="activity-select">
              <option value="">--Chọn hoạt động--</option>
              <!-- Danh sách hoạt động sẽ được thêm vào đây -->
            </select>
          </label>
          <div class="view-options">
            <label>
              <input type="radio" name="view-type" value="separate" checked> 
              Hiện theo loại
            </label>
            <label>
              <input type="radio" name="view-type" value="total"> 
              Hiện tổng hợp
            </label>
          </div>
        </div>
        <div class="activity-date-info" id="activity-date-info" style="margin-bottom: 10px; font-style: italic;"></div>
        <canvas id="activityChart" height="80"></canvas>
      </div>

      <!-- Thêm section xuất file -->
      <div class="report-section">
        <h2>Xuất dữ liệu</h2>
        <div class="export-controls">
          <div class="form-group">
            <label>Chọn bảng dữ liệu:</label>
            <select id="table-select" class="form-control">
              <option value="">-- Chọn bảng --</option>
              <option value="users">Người dùng</option>
              <option value="posts">Bài đăng</option>
              <option value="activities">Hoạt động</option>
              <option value="activity_items">Chi tiết hoạt động</option>
              <option value="notifications">Thông báo</option>
              <option value="audit_logs">Nhật ký hệ thống</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Từ ngày:</label>
            <input type="date" id="start-date" class="form-control">
          </div>

          <div class="form-group">
            <label>Đến ngày:</label>
            <input type="date" id="end-date" class="form-control">
          </div>

          <button id="export-btn" class="btn btn-primary" onclick="exportData()">
            Xuất file CSV
          </button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("content-area").innerHTML = content;

  // Load các chart
  loadReportChart();
  loadActivitiesList();
  loadCategories(); // Thêm dòng này

  // Event listeners
  document.getElementById("report-range").onchange = loadReportChart;
  document.getElementById("report-status").onchange = loadReportChart;
  document.getElementById("report-category").onchange = loadReportChart; // Thêm dòng này

  document.getElementById("activity-select").onchange = loadActivityChart;

  document.querySelectorAll('input[name="view-type"]').forEach((radio) => {
    radio.onchange = loadActivityChart;
  });
}

// Hàm load danh sách hoạt động cho dropdown
async function loadActivitiesList() {
  try {
    const res = await fetch("/api/admin/reports/activities/list", {
      credentials: "include",
    });
    const activities = await res.json();

    const activitySelect = document.getElementById("activity-select");

    // Xóa các option cũ nếu có
    while (activitySelect.options.length > 1) {
      activitySelect.remove(1);
    }

    // Thêm các option mới
    activities.forEach((activity) => {
      const startDate = new Date(activity.start_date).toLocaleDateString(
        "vi-VN"
      );
      const option = document.createElement("option");
      option.value = activity.id;
      option.textContent = `${activity.title} (${startDate})`;
      activitySelect.appendChild(option);
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hoạt động:", error);
  }
}

// Hàm load chart cho hoạt động
async function loadActivityChart() {
  const activityId = document.getElementById("activity-select").value;

  if (!activityId) {
    // Nếu chưa chọn hoạt động, xóa chart cũ nếu có
    if (window.activityChartInstance) {
      window.activityChartInstance.destroy();
      window.activityChartInstance = null;
    }
    document.getElementById("activity-date-info").textContent = "";
    return;
  }

  try {
    const res = await fetch(
      `/api/admin/reports/activities?activityId=${activityId}`,
      {
        credentials: "include",
      }
    );
    const data = await res.json();

    // Hiển thị thông tin thời gian
    const startDate = new Date(data.activity.start_date).toLocaleDateString(
      "vi-VN"
    );
    const endDate = new Date(data.activity.end_date).toLocaleDateString(
      "vi-VN"
    );
    document.getElementById(
      "activity-date-info"
    ).textContent = `Thời gian: ${startDate} - ${endDate}`;

    // Xóa chart cũ nếu có
    if (window.activityChartInstance) {
      window.activityChartInstance.destroy();
    }

    const ctx = document.getElementById("activityChart").getContext("2d");
    const viewType = document.querySelector(
      'input[name="view-type"]:checked'
    ).value;

    let chartData;
    let chartOptions;

    if (viewType === "total") {
      // Hiển thị tổng hợp (so sánh cần và đã nhận)
      chartData = {
        labels: data.labels,
        datasets: [
          {
            label: "Số lượng cần",
            data: data.datasets.needed,
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            borderColor: "rgb(255, 99, 132)",
            borderWidth: 1,
            stack: "Stack 0",
          },
          {
            label: "Số lượng đã nhận",
            data: data.datasets.received,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgb(54, 162, 235)",
            borderWidth: 1,
            stack: "Stack 0",
          },
        ],
      };

      chartOptions = {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: "Sản phẩm" },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Số lượng" },
          },
        },
        plugins: {
          title: {
            display: true,
            text: `Thống kê sản phẩm: ${data.activity.title}`,
          },
        },
      };

      window.activityChartInstance = new Chart(ctx, {
        type: "bar",
        data: chartData,
        options: chartOptions,
      });
    } else {
      // Hiển thị theo % hoàn thành cho từng loại sản phẩm
      chartData = {
        labels: data.labels,
        datasets: [
          {
            label: "% hoàn thành",
            data: data.datasets.percentage,
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgb(75, 192, 192)",
            borderWidth: 1,
            borderRadius: 5,
          },
        ],
      };

      chartOptions = {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: "Sản phẩm" },
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Hoàn thành (%)" },
            max: 100,
          },
        },
        plugins: {
          title: {
            display: true,
            text: `Tỷ lệ hoàn thành: ${data.activity.title}`,
          },
        },
      };

      window.activityChartInstance = new Chart(ctx, {
        type: "bar",
        data: chartData,
        options: chartOptions,
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu chart hoạt động:", error);
  }
}
// Hàm load danh sách danh mục cho dropdown
async function loadCategories() {
  try {
    const res = await fetch("/api/categories");
    const categories = await res.json();

    const categorySelect = document.getElementById("report-category");

    // Giữ lại option "Tất cả"
    while (categorySelect.options.length > 1) {
      categorySelect.remove(1);
    }

    // Thêm các option danh mục
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách danh mục:", error);
  }
}
// ...existing code...
async function loadReportChart() {
  const range = document.getElementById("report-range").value;
  const status = document.getElementById("report-status").value;
  const category = document.getElementById("report-category").value;

  const res = await fetch(
    `/api/admin/reports/posts?range=${range}&status=${status}&category=${category}`,
    { credentials: "include" }
  );
  const data = await res.json();

  // Xóa chart cũ nếu có
  if (window.reportChartInstance) {
    window.reportChartInstance.destroy();
  }

  const ctx = document.getElementById("reportChart").getContext("2d");
  window.reportChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Số lượng sản phẩm",
          data: data.counts,
          borderColor: "#007bff",
          backgroundColor: "rgba(0,123,255,0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { title: { display: true, text: data.xLabel } },
        y: { beginAtZero: true, title: { display: true, text: "Số lượng" } },
      },
    },
  });
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

async function exportData() {
  const tableSelect = document.getElementById("table-select");
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  if (!tableSelect.value) {
    alert("Vui lòng chọn bảng dữ liệu");
    return;
  }

  if (!startDate || !endDate) {
    alert("Vui lòng chọn khoảng thời gian");
    return;
  }

  try {
    const response = await fetch("/api/admin/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        table: tableSelect.value,
        startDate,
        endDate,
      }),
    });

    if (!response.ok) throw new Error("Export failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableSelect.value}_${startDate}_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error exporting data:", error);
    alert("Có lỗi khi xuất file");
  }
}

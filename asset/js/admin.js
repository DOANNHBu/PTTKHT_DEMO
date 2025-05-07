// Kiểm tra đăng nhập admin
function checkAdminAuth() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role_id !== 1) {
        alert('Bạn không có quyền truy cập trang này!');
        window.location.href = '/page/login.html';
        return false;
    }
    return true;
}

// Load nội dung cho từng section
function loadContent(section) {
    const contentArea = document.getElementById('content-area');
    switch (section) {
        case 'users':
            loadUserManagement();
            break;
        case 'posts':
            loadPostApproval();
            break;
        case 'activities':
            loadActivityManagement();
            break;
        case 'reports':
            loadReports();
            break;
        default:
            loadDashboard();
    }
}

// Quản lý tài khoản
function loadUserManagement() {
    fetch('/page/user-management.html')
        .then(r => r.text())
        .then(html => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const content = doc.querySelector('.user-management').outerHTML;
            const modal = doc.getElementById('createUserModal').outerHTML;
            document.getElementById('content-area').innerHTML = content + modal;

            // Manual init để gắn sự kiện vào DOM vừa inject
            window.userManager = new UserManager();
        })
        .catch(err => {
            console.error('Error loading user-management:', err);
            document.getElementById('content-area')
                .innerHTML = '<div class="error">Không thể tải trang quản lý tài khoản</div>';
        });
}

// Duyệt bài đăng
function loadPostApproval() {
    // Thay đổi cách load nội dung post-approval
    const content = `
        <div class="post-approval">
            <h2>Duyệt bài đăng</h2>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>Tiêu đề</th>
                        <th>Người đăng</th>
                        <th>Ngày đăng</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody id="posts-table">
                    <!-- Dữ liệu sẽ được load động -->
                </tbody>
            </table>
        </div>

        <!-- Modal xem chi tiết bài đăng -->
        <div id="postDetailModal" class="post-detail-modal">
            <!-- Nội dung modal sẽ được thêm động -->
        </div>
    `;

    document.getElementById('content-area').innerHTML = content;

    // Khởi tạo đối tượng PostApproval và load dữ liệu
    window.postApproval = new PostApproval();
    postApproval.loadPendingPosts();
}

// Thay đổi hàm loadActivityManagement()
function loadActivityManagement() {
    // Load nội dung từ file activities.html
    fetch('/page/activities_ad.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content-area').innerHTML = html;
            // Khởi tạo ActivityManager sau khi load HTML
            if (typeof activityManager === 'undefined') {
                window.activityManager = new ActivityManager();
            }
            activityManager.loadActivities();
        })
        .catch(error => {
            console.error('Error loading activities page:', error);
            document.getElementById('content-area').innerHTML = '<div class="error">Không thể tải trang quản lý hoạt động</div>';
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
    document.getElementById('content-area').innerHTML = content;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAdminAuth()) return;

    // Handle navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            if (this.id === 'logout') {
                handleLogout();
                return;
            }
            const section = this.getAttribute('href').substring(1);
            loadContent(section);

            // Update active state
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Load default content
    loadContent('dashboard');
});

// Thêm hàm xử lý đăng xuất
function handleLogout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = '/page/login.html';
    }
}
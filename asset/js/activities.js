class ActivitiesViewer {
  constructor() {
    this.activities = [];
    this.loadActivities();
  }

  async loadActivities() {
    try {
      const [activitiesResponse, itemsResponse] = await Promise.all([
        fetch('http://localhost:3000/activities'),
        fetch('http://localhost:3000/activity_items')
      ]);

      const activities = await activitiesResponse.json();
      const items = await itemsResponse.json();

      // Chỉ lấy các hoạt động có status = 'approved'
      this.activities = activities
        .filter(activity => activity.status === 'approved')
        .map(activity => ({
          ...activity,
          items: items.filter(item => item.activity_id === activity.id)
        }));

      this.renderActivities();
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      this.showError("Không thể tải danh sách hoạt động");
    }
  }

  renderActivities() {
    const eventsList = document.getElementById("events-list");
    if (!eventsList) return;

    if (!this.activities.length) {
      eventsList.innerHTML = '<p class="no-events">Hiện chưa có hoạt động quyên góp nào.</p>';
      return;
    }

    eventsList.innerHTML = this.activities.map(activity => `
            <div class="event-item">
                <div class="event-content">
                    <div class="event-text">
                        <h3>${activity.title}</h3>
                        <p><strong>Thời gian:</strong> ${this.formatDateRange(activity.start_date, activity.end_date)}</p>
                        <p><strong>Địa điểm:</strong> ${activity.location}</p>
                        <button onclick="activitiesViewer.showEventDetail('${activity.id}')">
                            Xem chi tiết
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
  }

  async showEventDetail(activityId) {
    try {
      const activity = this.activities.find(a => a.id.toString() === activityId.toString());
      if (!activity) return;

      const eventsList = document.getElementById("events-list");
      const eventDetail = document.getElementById("event-detail");

      eventDetail.innerHTML = `
                <h2>${activity.title}</h2>
                <div class="event-info">
                    <p><strong>Thời gian:</strong> ${this.formatDateRange(activity.start_date, activity.end_date)}</p>
                    <p><strong>Địa điểm:</strong> ${activity.location}</p>
                    <p><strong>Mô tả:</strong> ${activity.description}</p>
                    
                    <div class="donation-items">
                        <h3>Danh sách vật phẩm cần quyên góp</h3>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Tên vật phẩm</th>
                                    <th>Mô tả</th>
                                    <th>Số lượng cần</th>
                                    <th>Đã nhận</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${activity.items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>${item.description || ''}</td>
                                        <td>${item.quantity_needed}</td>
                                        <td>${item.quantity_received}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <button onclick="activitiesViewer.backToList()" class="back-button">
                    Quay lại
                </button>
            `;

      eventsList.style.display = "none";
      eventDetail.style.display = "block";

    } catch (error) {
      console.error("Lỗi khi hiển thị chi tiết:", error);
      this.showError("Không thể tải thông tin chi tiết");
    }
  }

  backToList() {
    document.getElementById("events-list").style.display = "block";
    document.getElementById("event-detail").style.display = "none";
  }

  formatDateRange(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`;
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  }
}

// Khởi tạo viewer khi trang được load
const activitiesViewer = new ActivitiesViewer();
window.activitiesViewer = activitiesViewer;

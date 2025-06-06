class ActivityManager {
  constructor() {
    this.activities = [];
    this.loadActivities();
  }

  // Load activities from MySQL API
  async loadActivities() {
    try {
      this.showLoading();
      const response = await fetch("/api/admin/activities", {
        credentials: "include", // Quan trọng: thêm credentials để gửi session cookie
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const activities = await response.json();
      this.activities = activities;

      this.hideLoading();
      this.renderActivities();
    } catch (error) {
      console.error("Error loading activities:", error);
      this.showToast("Lỗi tải dữ liệu", "error");
      this.hideLoading();
    }
  }

  async saveActivity(activityData) {
    try {
      // Format dates to MySQL datetime format
      const formattedData = {
        ...activityData,
        start_date: new Date(activityData.start_date)
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        end_date: new Date(activityData.end_date)
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
      };

      const response = await fetch("/api/admin/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create activity");
      }

      const savedActivity = await response.json();

      // Return to activities list view after successful creation
      const content = `
                <div class="card">
                    <div class="activity-controls">
                        <h2>Quản lý hoạt động</h2>
                        <button class="btn btn-primary" onclick="activityManager.showCreateForm()">
                            + Tạo hoạt động mới
                        </button>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Tên hoạt động</th>
                                <th>Thời gian</th>
                                <th>Địa điểm</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="activities-table">
                        </tbody>
                    </table>
                </div>
            `;

      document.getElementById("content-area").innerHTML = content;
      await this.loadActivities();
      this.showToast("Tạo hoạt động thành công");

      return savedActivity;
    } catch (error) {
      console.error("Error saving activity:", error);
      this.showToast("Tạo hoạt động thất bại: " + error.message, "error");
      throw error;
    }
  }

  // Render activities list
  renderActivities() {
    const tableBody = document.getElementById("activities-table");
    if (!tableBody) return;

    if (!this.activities || this.activities.length === 0) {
      tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">Chưa có hoạt động nào</td>
            </tr>
        `;
      return;
    }

    tableBody.innerHTML = this.activities
      .map(
        (activity) => `
            <tr>
                <td>${activity.title}</td>
                <td>${this.formatDateRange(activity.start_date, activity.end_date)}</td>
                <td>${activity.location}</td>
                <td>${activity.name_organizer}</td>
                <td><span class="status-badge status-${activity.status}">
                    ${this.formatStatus(activity.status)}
                </span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="activityManager.viewActivity('${activity.id}')">
                            Chi tiết
                        </button>
                        <button class="btn btn-warning" onclick="activityManager.editActivity('${activity.id}')">
                            Sửa
                        </button>
                        <button class="btn btn-danger" onclick="activityManager.deleteActivity('${activity.id}')">
                            Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `
      )
      .join("");
  }

  // Cập nhật phương thức showCreateForm
  showCreateForm() {
    const formHtml = `
            <div class="activity-form">
                <h2>Tạo hoạt động mới</h2>
                <form id="activityForm" onsubmit="return activityManager.handleSubmit(event)">
                    <div class="form-group">
                        <label>Tiêu đề *</label>
                        <input type="text" name="title" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Mô tả chi tiết *</label>
                        <textarea name="description" rows="4" required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Ngày bắt đầu *</label>
                        <input type="datetime-local" name="start_date" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Ngày kết thúc *</label>
                        <input type="datetime-local" name="end_date" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Địa điểm *</label>
                        <input type="text" name="location" required>
                    </div>

                    <div class="form-group">
                        <label>Đơn vị tổ chức *</label>
                        <input type="text" name="name_organizer" required>
                    </div>
                    
                    <div class="donation-items">
                        <h3>Danh sách đồ cần quyên góp</h3>
                        <div id="itemsList"></div>
                        <button type="button" onclick="activityManager.addItemRow()">
                            + Thêm vật phẩm
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <label>Hướng dẫn tham gia</label>
                        <textarea name="guidelines" rows="3"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Lưu hoạt động</button>
                        <button type="button" class="btn btn-secondary" onclick="activityManager.cancelCreate()">
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        `;

    document.getElementById("content-area").innerHTML = formHtml;
    this.addItemRow(); // Add first item row by default
  }

  // Thêm phương thức mới để xử lý hủy tạo mới
  cancelCreate() {
    if (confirm("Bạn có chắc muốn hủy tạo hoạt động mới?")) {
      // Load lại giao diện quản lý hoạt động
      const content = `
                <div class="card">
                    <div class="activity-controls">
                        <h2>Quản lý hoạt động</h2>
                        <button class="btn btn-primary" onclick="activityManager.showCreateForm()">
                            + Tạo hoạt động mới
                        </button>
                    </div>
                    
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Tên hoạt động</th>
                                <th>Thời gian</th>
                                <th>Địa điểm</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="activities-table">
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
            `;

      // Cập nhật nội dung
      document.getElementById("content-area").innerHTML = content;

      // Render lại danh sách hoạt động
      this.renderActivities();
    }
  }

  addItemRow() {
    const itemsList = document.getElementById("itemsList");
    const itemRow = document.createElement("div");
    itemRow.className = "item-row";
    itemRow.innerHTML = `
            <div class="form-group">
                <input type="text" class="item-name" placeholder="Tên vật phẩm" required>
            </div>
            <div class="form-group">
                <input type="number" class="item-quantity" placeholder="Số lượng" min="1" required>
            </div>
            <div class="form-group">
                <textarea class="item-description" placeholder="Mô tả"></textarea>
            </div>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">
                Xóa
            </button>
        `;
    itemsList.appendChild(itemRow);
  }

  async handleSubmit(event) {
    event.preventDefault();
    const form = event.target;

    if (!this.validateForm(form)) {
      return false;
    }

    try {
      const activityData = this.collectFormData(form);
      await this.saveActivity(activityData);
      alert("Tạo hoạt động thành công!");
      this.loadActivities();
    } catch (error) {
      alert("Tạo hoạt động thất bại, vui lòng thử lại sau.");
      console.error(error);
    }

    return false;
  }

  validateForm(form) {
    const startDate = new Date(form.start_date.value);
    const endDate = new Date(form.end_date.value);

    if (startDate > endDate) {
      alert("Ngày kết thúc phải sau ngày bắt đầu");
      return false;
    }

    return true;
  }

  // Cập nhật phương thức collectFormData
  collectFormData(form) {
    const formData = new FormData(form);
    const items = [];

    // Collect all item rows
    const itemRows = document.querySelectorAll(".item-row");
    itemRows.forEach((row) => {
      const nameInput = row.querySelector(".item-name");
      const quantityInput = row.querySelector(".item-quantity");
      const descriptionInput = row.querySelector(".item-description");

      if (nameInput && quantityInput) {
        const item = {
          name: nameInput.value.trim(),
          quantity_needed: parseInt(quantityInput.value),
          description: descriptionInput ? descriptionInput.value.trim() : "",
          quantity_received: 0,
        };

        if (
          item.name &&
          !isNaN(item.quantity_needed) &&
          item.quantity_needed > 0
        ) {
          items.push(item);
        }
      }
    });

    return {
      title: formData.get("title"),
      description: formData.get("description"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
      location: formData.get("location"),
      name_organizer: formData.get("name_organizer"), // Make sure this field is included
      guidelines: formData.get("guidelines") || "",
      status: "approved",
      items: items,
    };
  }

  formatDateRange(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }

  formatStatus(status) {
    const statusMap = {
      approved: "Đã duyệt",
      pending: "Chờ duyệt",
      deleted: "Đã xóa",
    };
    return statusMap[status] || status;
  }

  async viewActivity(activityId) {
    try {
      this.showLoading();

      const response = await fetch(`/api/admin/activities/${activityId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const activity = await response.json();

      // Tạo modal nếu chưa tồn tại
      let modal = document.getElementById("detailModal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "detailModal";
        modal.className = "modal";
        document.body.appendChild(modal);
      }

      // Tạo nội dung modal
      modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <div id="modalContent">
                        <h2>${activity.title}</h2>
                        <div class="activity-info">
                            <p><strong>Thời gian:</strong> ${this.formatDateRange(
        activity.start_date,
        activity.end_date
      )}</p>
                            <p><strong>Địa điểm:</strong> ${activity.location
        }</p>
                            <p><strong>Trạng thái:</strong> <span class="status-badge status-${activity.status
        }">${this.formatStatus(activity.status)}</span></p>
                            <p><strong>Mô tả:</strong> ${activity.description
        }</p>
                            ${activity.guidelines
          ? `<p><strong>Hướng dẫn:</strong> ${activity.guidelines}</p>`
          : ""
        }
                        </div>

                        <div class="donation-items">
                            <h3>Danh sách vật phẩm cần quyên góp</h3>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Tên vật phẩm</th>
                                        <th>Mô tả</th>
                                        <th>Số lượng cần</th>
                                        <th>Đã nhận</th>
                                        <th>Cập nhật</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${activity.items
          .map(
            (item) => `
                                        <tr>
                                            <td>${item.name}</td>
                                            <td>${item.description || ""}</td>
                                            <td>${item.quantity_needed}</td>
                                            <td>
                                                <input type="number" 
                                                    class="quantity-input" 
                                                    value="${item.quantity_received
              }"
                                                    min="0"
                                                    max="${item.quantity_needed
              }"
                                                    data-item-id="${item.id}">
                                            </td>
                                            <td>
                                                <button class="btn btn-primary btn-sm" 
                                                    onclick="activityManager.updateItemQuantity('${item.id
              }')">
                                                    Cập nhật
                                                </button>
                                            </td>
                                        </tr>
                                    `
          )
          .join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

      // Hiển thị modal
      modal.style.display = "block";
      this.hideLoading();

      // Xử lý đóng modal
      const closeBtn = modal.querySelector(".close");
      closeBtn.onclick = () => {
        modal.style.display = "none";
      };

      // Đóng modal khi click bên ngoài
      window.onclick = (event) => {
        if (event.target == modal) {
          modal.style.display = "none";
        }
      };
    } catch (error) {
      console.error("Error viewing activity:", error);
      this.showToast("Lỗi khi tải thông tin hoạt động", "error");
      this.hideLoading();
    }
  }

  closeModal() {
    const modal = document.querySelector(".modal");
    if (modal) {
      modal.remove();
    }
  }

  // Thêm phương thức editActivity()
  async editActivity(activityId) {
    const activity = this.activities.find(
      (a) => a.id.toString() === activityId.toString()
    );
    if (!activity) {
      alert("Không tìm thấy hoạt động!");
      return;
    }

    const formHtml = `
            <div class="activity-form">
                <h2>Chỉnh sửa hoạt động</h2>
                <form id="editActivityForm" onsubmit="return activityManager.handleEditSubmit(event, '${activityId}')">
                    <div class="form-group">
                        <label>Tiêu đề *</label>
                        <input type="text" name="title" required value="${activity.title
      }">
                    </div>
                    
                    <div class="form-group">
                        <label>Mô tả chi tiết *</label>
                        <textarea name="description" rows="4" required>${activity.description
      }</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Ngày bắt đầu *</label>
                        <input type="datetime-local" name="start_date" required 
                               value="${this.formatDateTimeForInput(
        activity.start_date
      )}">
                    </div>
                    
                    <div class="form-group">
                        <label>Ngày kết thúc *</label>
                        <input type="datetime-local" name="end_date" required
                               value="${this.formatDateTimeForInput(
        activity.end_date
      )}">
                    </div>
                    
                    <div class="form-group">
                        <label>Địa điểm *</label>
                        <input type="text" name="location" required value="${activity.location
      }">
                    </div>

                    <div class="form-group">
                        <label>Đơn vị tổ chức *</label>
                        <input type="text" name="name_organizer" required value="${activity.name_organizer
      }">
                    </div>

                    <div class="donation-items">
                        <h3>Danh sách đồ cần quyên góp</h3>
                        <div id="itemsList">
                            ${activity.items
        .map(
          (item) => `
                                <div class="item-row">
                                    <div class="form-group">
                                        <input type="text" class="item-name" placeholder="Tên vật phẩm" 
                                            required value="${item.name}">
                                    </div>
                                    <div class="form-group">
                                        <input type="number" class="item-quantity" placeholder="Số lượng" 
                                            min="1" required value="${item.quantity_needed
            }">
                                    </div>
                                    <div class="form-group">
                                        <textarea class="item-description" placeholder="Mô tả">${item.description || ""
            }</textarea>
                                    </div>
                                    <button type="button" class="btn btn-danger btn-sm" 
                                        onclick="this.parentElement.remove()">Xóa</button>
                                </div>
                            `
        )
        .join("")}
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="activityManager.addItemRow()">
                            + Thêm vật phẩm
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <label>Hướng dẫn tham gia</label>
                        <textarea name="guidelines" rows="3">${activity.guidelines || ""
      }</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
                        <button type="button" class="btn btn-secondary" onclick="activityManager.cancelEdit()">
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        `;

    document.getElementById("content-area").innerHTML = formHtml;
  }

  // Thêm phương thức xử lý submit form chỉnh sửa
  async handleEditSubmit(event, activityId) {
    event.preventDefault();
    const form = event.target;

    if (!this.validateForm(form)) {
      return false;
    }

    try {
      const activityData = this.collectFormData(form);
      this.showLoading();

      const response = await fetch(`/api/admin/activities/${activityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(activityData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update activity");
      }

      // Return to activities list view
      const content = `
                <div class="card">
                    <div class="activity-controls">
                        <h2>Quản lý hoạt động</h2>
                        <button class="btn btn-primary" onclick="activityManager.showCreateForm()">
                            + Tạo hoạt động mới
                        </button>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Tên hoạt động</th>
                                <th>Thời gian</th>
                                <th>Địa điểm</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="activities-table">
                        </tbody>
                    </table>
                </div>
            `;

      const contentArea = document.getElementById("content-area");
      if (contentArea) {
        contentArea.innerHTML = content;
      }

      await this.loadActivities();
      this.showToast("Cập nhật hoạt động thành công", "success");
    } catch (error) {
      console.error("Error updating activity:", error);
      this.showToast("Cập nhật hoạt động thất bại: " + error.message, "error");
    } finally {
      this.hideLoading();
    }

    return false;
  }

  // Thêm phương thức hỗ trợ định dạng datetime cho input
  formatDateTimeForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  // Sửa lại phương thức cancelEdit
  cancelEdit() {
    // Load lại giao diện quản lý hoạt động
    const content = `
            <div class="card">
                <div class="activity-controls">
                    <h2>Quản lý hoạt động</h2>
                    <button class="btn btn-primary" onclick="activityManager.showCreateForm()">
                        + Tạo hoạt động mới
                    </button>
                </div>
                
                <table class="table">
                    <thead>
                        <tr>
                            <th>Tên hoạt động</th>
                            <th>Thời gian</th>
                            <th>Địa điểm</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="activities-table">
                        <!-- Data will be loaded here -->
                    </tbody>
                </table>
            </div>
        `;

    // Cập nhật nội dung
    document.getElementById("content-area").innerHTML = content;

    // Render lại danh sách hoạt động
    this.renderActivities();
  }

  showLoading() {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) {
      spinner.style.display = "flex";
    }
  }

  hideLoading() {
    const spinner = document.getElementById("loading-spinner");
    if (spinner) {
      spinner.style.display = "none";
    }
  }

  showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) {
      // Create toast element if it doesn't exist
      const toastDiv = document.createElement("div");
      toastDiv.id = "toast";
      toastDiv.className = "toast";
      document.body.appendChild(toastDiv);
    }

    const toastElement = document.getElementById("toast");
    if (toastElement) {
      toastElement.textContent = message;
      toastElement.className = `toast ${type}`;
      toastElement.style.display = "block";
      setTimeout(() => {
        toastElement.style.display = "none";
      }, 3000);
    }
  }

  async updateItemQuantity(itemId) {
    try {
      const input = document.querySelector(`input[data-item-id="${itemId}"]`);
      const newQuantity = parseInt(input.value);

      if (isNaN(newQuantity) || newQuantity < 0) {
        this.showToast("Số lượng không hợp lệ", "error");
        return;
      }

      this.showLoading();

      const response = await fetch(`/api/admin/activity-items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          quantity_received: newQuantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update quantity");
      }

      const updatedItem = await response.json();
      this.showToast("Cập nhật số lượng thành công");
      this.hideLoading();
    } catch (error) {
      console.error("Error updating quantity:", error);
      this.showToast("Lỗi khi cập nhật số lượng", "error");
      this.hideLoading();
    }
  }

  async deleteActivity(activityId) {
    try {
      // Hiện hộp thoại xác nhận
      const isConfirmed = confirm(
        "Bạn có chắc chắn muốn xóa hoạt động này không?"
      );

      if (!isConfirmed) {
        return;
      }

      this.showLoading();

      // Gọi API endpoint mới để xóa hoạt động
      const response = await fetch(`/api/admin/activities/${activityId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Lỗi khi xóa hoạt động");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Lỗi khi xóa hoạt động");
      }

      this.hideLoading();
      this.showToast("Xóa hoạt động thành công");

      // Refresh danh sách
      await this.loadActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
      this.showToast("Lỗi khi xóa hoạt động", "error");
      this.hideLoading();
    }
  }

  // Initialize
  init() {
    this.loadActivities();
    // Add event listeners if needed
  }
}

// Initialize and attach to window
const activityManager = new ActivityManager();
window.activityManager = activityManager;

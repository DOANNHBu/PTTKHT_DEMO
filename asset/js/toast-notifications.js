class ToastNotification {
  constructor() {
    this.createContainer();
    this.toasts = [];
  }

  createContainer() {
    // Kiểm tra xem container đã tồn tại chưa
    const existingContainer = document.querySelector(".toast-container");
    if (existingContainer) {
      this.container = existingContainer;
      return;
    }

    // Nếu chưa tồn tại, tạo container mới
    this.container = document.createElement("div");
    this.container.className = "toast-container";
    document.body.appendChild(this.container);
  }

  show(message, type = "success", duration = 3000) {
    // Tạo toast element
    const toast = document.createElement("div");
    const id = "toast-" + Date.now();
    toast.id = id;
    toast.className = `toast toast-${type}`;

    // Chọn icon phù hợp với loại thông báo
    let icon = "";
    switch (type) {
      case "success":
        icon = '<i class="fas fa-check-circle toast-icon"></i>';
        break;
      case "error":
        icon = '<i class="fas fa-exclamation-circle toast-icon"></i>';
        break;
      case "warning":
        icon = '<i class="fas fa-exclamation-triangle toast-icon"></i>';
        break;
      case "info":
        icon = '<i class="fas fa-info-circle toast-icon"></i>';
        break;
    }

    toast.innerHTML = `
      <div class="toast-content">
        ${icon}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;

    // Thêm vào container
    this.container.appendChild(toast);
    this.toasts.push({ id, timer: null });

    // Thêm event listener cho nút đóng
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => this.close(id));

    // Tự động đóng sau khoảng thời gian
    if (duration > 0) {
      const timer = setTimeout(() => this.close(id), duration);
      this.toasts.find((t) => t.id === id).timer = timer;
    }

    return id;
  }

  close(id) {
    const toast = document.getElementById(id);
    if (!toast) return;

    // Tìm và xóa timer nếu có
    const index = this.toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      if (this.toasts[index].timer) {
        clearTimeout(this.toasts[index].timer);
      }
      this.toasts.splice(index, 1);
    }

    // Animation khi đóng
    toast.classList.add("fade-out");

    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Các method tiện ích
  success(message, duration = 3000) {
    return this.show(message, "success", duration);
  }

  error(message, duration = 3000) {
    return this.show(message, "error", duration);
  }

  warning(message, duration = 3000) {
    return this.show(message, "warning", duration);
  }

  info(message, duration = 3000) {
    return this.show(message, "info", duration);
  }
}

class ModalDialog {
  constructor() {
    // Đảm bảo chỉ có một instance
    if (ModalDialog.instance) {
      return ModalDialog.instance;
    }
    ModalDialog.instance = this;

    this.modalId = "confirm-modal-" + Date.now();
    this.createModal();
  }

  createModal() {
    const modalHTML = `
      <div id="${this.modalId}-backdrop" class="confirm-modal-backdrop">
        <div class="confirm-modal">
          <div class="confirm-modal-header">
            <div class="icon warning">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="title">Xác nhận</div>
          </div>
          <div class="confirm-modal-body">
            <p id="${this.modalId}-message"></p>
          </div>
          <div class="confirm-modal-footer">
            <button id="${this.modalId}-cancel" class="confirm-btn confirm-btn-cancel">Hủy</button>
            <button id="${this.modalId}-confirm" class="confirm-btn confirm-btn-confirm">Xác nhận</button>
          </div>
        </div>
      </div>
    `;

    // Thêm modal vào body
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    // Lưu tham chiếu đến các phần tử
    this.modalBackdrop = document.getElementById(`${this.modalId}-backdrop`);
    this.messageElement = document.getElementById(`${this.modalId}-message`);
    this.cancelButton = document.getElementById(`${this.modalId}-cancel`);
    this.confirmButton = document.getElementById(`${this.modalId}-confirm`);

    // Thêm sự kiện đóng modal khi click ra ngoài
    this.modalBackdrop.addEventListener("click", (event) => {
      if (event.target === this.modalBackdrop) {
        this.close();
        if (this.currentReject) {
          this.currentReject();
          this.currentReject = null;
        }
      }
    });
  }

  confirm(options = {}) {
    // Tùy chọn mặc định
    const defaultOptions = {
      title: "Xác nhận",
      message: "Bạn có chắc chắn muốn thực hiện hành động này?",
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      type: "warning", // warning, info, success, error
      confirmButtonClass: "", // primary, success,...
    };

    const settings = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      // Lưu trữ hàm reject hiện tại để sử dụng khi cần
      this.currentReject = reject;

      // Cập nhật nội dung modal
      this.messageElement.textContent = settings.message;

      // Cập nhật tiêu đề
      const titleElement = this.modalBackdrop.querySelector(".title");
      titleElement.textContent = settings.title;

      // Cập nhật icon loại
      const iconElement = this.modalBackdrop.querySelector(".icon");
      iconElement.className = `icon ${settings.type}`;

      // Cập nhật icon tương ứng với loại
      let iconClass = "fa-exclamation-triangle";
      switch (settings.type) {
        case "info":
          iconClass = "fa-info-circle";
          break;
        case "success":
          iconClass = "fa-check-circle";
          break;
        case "error":
          iconClass = "fa-times-circle";
          break;
      }
      iconElement.innerHTML = `<i class="fas ${iconClass}"></i>`;

      // Cập nhật text các nút
      this.cancelButton.textContent = settings.cancelText;
      this.confirmButton.textContent = settings.confirmText;

      // Cập nhật class nút xác nhận
      this.confirmButton.className = `confirm-btn confirm-btn-confirm ${settings.confirmButtonClass}`;

      // Xử lý sự kiện nút
      const handleConfirm = () => {
        this.close();
        resolve(true);
      };

      const handleCancel = () => {
        this.close();
        resolve(false);
      };

      // Loại bỏ các sự kiện cũ nếu có
      this.confirmButton.removeEventListener("click", handleConfirm);
      this.cancelButton.removeEventListener("click", handleCancel);

      // Thêm sự kiện mới
      this.confirmButton.addEventListener("click", handleConfirm);
      this.cancelButton.addEventListener("click", handleCancel);

      // Hiển thị modal
      this.open();
    });
  }

  open() {
    this.modalBackdrop.classList.add("active");
    // Focus vào nút cancel để người dùng có thể nhấn Esc để hủy
    setTimeout(() => {
      this.cancelButton.focus();
    }, 100);
  }

  close() {
    this.modalBackdrop.classList.remove("active");
    this.currentReject = null;
  }
}

// Khởi tạo và gắn vào window
window.modalDialog = new ModalDialog();

// Khởi tạo và gắn vào window
window.toastNotification = new ToastNotification();

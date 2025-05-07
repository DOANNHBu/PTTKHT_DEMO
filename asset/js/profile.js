class ProfileManager {
  constructor() {
    // Kiểm tra trạng thái đăng nhập từ sessionStorage thay vì localStorage
    this.currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (!this.currentUser) {
      alert('Vui lòng đăng nhập để xem thông tin cá nhân');
      window.location.href = '/page/login.html';
      return;
    }

    this.loadUserProfile();
    this.initializeEventListeners();
    this.updateHeaderInfo();
  }

  async loadUserProfile() {
    try {
      // Thêm loading state
      const profileInfo = document.getElementById('profileInfo');
      if (profileInfo) {
        profileInfo.innerHTML = '<p>Đang tải thông tin...</p>';
      }

      const response = await fetch(`http://localhost:3000/users/${this.currentUser.id}`);
      if (!response.ok) throw new Error('Failed to load user profile');

      const userData = await response.json();
      this.currentUser = userData;
      this.updateProfileDisplay(userData);

    } catch (error) {
      console.error('Error loading profile:', error);
      // Hiển thị lỗi trong giao diện
      const profileInfo = document.getElementById('profileInfo');
      if (profileInfo) {
        profileInfo.innerHTML = `
          <div class="error-message">
            <p>Không thể tải thông tin người dùng</p>
            <button class="btn btn-primary" onclick="location.reload()">
              Thử lại
            </button>
          </div>
        `;
      }
    }
  }

  updateProfileDisplay(user) {
    const profileInfo = document.getElementById('profileInfo');
    if (!profileInfo) return;

    profileInfo.innerHTML = `
          <p><strong>Họ và tên:</strong> ${user.full_name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Số điện thoại:</strong> ${user.phone || 'Chưa cập nhật'}</p>
          <p><strong>Địa chỉ:</strong> ${user.address || 'Chưa cập nhật'}</p>
          <p><strong>Trường:</strong> ${user.school_name}</p>
          <p><strong>Lớp:</strong> ${user.class_name || 'Không có'}</p>
      `;

    // Update avatar if exists
    const avatarImg = document.getElementById('userAvatar');
    if (avatarImg && user.avatar_url) {
      avatarImg.src = user.avatar_url;
    }

    // Update school info in modal
    document.getElementById('schoolName').textContent = user.school_name;
    document.getElementById('className').textContent = user.class_name || 'Không có';
  }

  async updateProfile(formData) {
    try {
      const { confirmPassword, ...updateData } = formData;

      // Show loading state
      const submitBtn = document.querySelector('.btn-submit');
      submitBtn.textContent = 'Đang cập nhật...';
      submitBtn.disabled = true;

      // Get current user data to compare changes
      const currentResponse = await fetch(`http://localhost:3000/users/${this.currentUser.id}`);
      if (!currentResponse.ok) {
        throw new Error('Không thể tải thông tin người dùng');
      }
      const currentData = await currentResponse.json();

      // Only include changed fields
      const changedData = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] && updateData[key] !== currentData[key]) {
          changedData[key] = updateData[key];
        }
      });

      // If there are changes to update
      if (Object.keys(changedData).length > 0) {
        const response = await fetch(`http://localhost:3000/users/${this.currentUser.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...changedData,
            updated_at: new Date().toISOString()
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedUser = await response.json();

        // Update session storage
        this.currentUser = updatedUser;
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Update display
        this.updateProfileDisplay(updatedUser);
        this.closeModal();
        alert('Cập nhật thông tin thành công!');
      } else {
        alert('Không có thông tin nào được thay đổi');
        this.closeModal();
      }

    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Lỗi cập nhật: ${error.message}`);
    } finally {
      // Reset button state
      const submitBtn = document.querySelector('.btn-submit');
      submitBtn.textContent = 'Lưu thay đổi';
      submitBtn.disabled = false;
    }
  }

  validateForm(formData) {
    const { password, confirmPassword, email, full_name } = formData;

    if (!full_name || full_name.trim() === '') {
      alert('Họ và tên không được để trống');
      return false;
    }

    if (!email || !email.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
      alert('Email không hợp lệ');
      return false;
    }

    if (password) {
      if (password.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự');
        return false;
      }
      if (password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp');
        return false;
      }
    }

    return true;
  }

  initializeEventListeners() {
    const updateForm = document.getElementById('updateProfileForm');
    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        full_name: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        password: document.getElementById('newPassword').value,
        confirmPassword: document.getElementById('confirmPassword').value
      };

      if (this.validateForm(formData)) {
        await this.updateProfile(formData);
      }
    });

    // Modal close handlers
    const modal = document.getElementById('editModal');
    const closeBtn = document.querySelector('.close');

    closeBtn.onclick = () => this.closeModal();
    window.onclick = (event) => {
      if (event.target === modal) {
        this.closeModal();
      }
    };
  }

  openModal() {
    const modal = document.getElementById('editModal');

    // Pre-fill form with current user data
    document.getElementById('fullName').value = this.currentUser.full_name;
    document.getElementById('email').value = this.currentUser.email;
    document.getElementById('phone').value = this.currentUser.phone || '';
    document.getElementById('address').value = this.currentUser.address || '';

    modal.style.display = 'block';
  }

  closeModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
  }

  // Thêm phương thức updateHeaderInfo
  updateHeaderInfo() {
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');

    if (this.currentUser) {
      userInfo.textContent = `Xin chào, ${this.currentUser.full_name}`;
      logoutBtn.style.display = 'inline-block';
    }
  }
}

// Thêm hàm xử lý đăng xuất
function handleLogout() {
  if (confirm('Bạn có chắc muốn đăng xuất?')) {
    sessionStorage.removeItem('currentUser');
    window.location.href = '/page/login.html';
  }
}

// Thêm CSS cho error message
const style = document.createElement('style');
style.textContent = `
  .error-message {
    text-align: center;
    padding: 20px;
    background: #fff3cd;
    border: 1px solid #ffeeba;
    border-radius: 5px;
    margin: 10px 0;
  }
  
  .error-message p {
    color: #856404;
    margin-bottom: 10px;
  }
`;
document.head.appendChild(style);

// Chỉ khởi tạo ProfileManager khi document đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  const profileManager = new ProfileManager();
  window.profileManager = profileManager;
  window.openEditModal = () => profileManager.openModal();
});
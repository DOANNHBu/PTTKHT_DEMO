class UserManager {
    constructor() {
        this.users = [];
        this.currentRole = '2'; // Default to user role
        this.initializeEventListeners();
        this.loadUsers();
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                credentials: 'include'
            });
            this.users = await response.json();
            this.filterAndRenderUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Không thể tải danh sách người dùng');
        }
    }

    filterAndRenderUsers() {
        const filteredUsers = this.users.filter(user =>
            user.role_id.toString() === this.currentRole
        );
        this.renderUsers(filteredUsers);
    }

    renderUsers(users) {
        const tableBody = document.getElementById('users-table');
        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.full_name}</td>
                <td>${user.email}</td>
                <td>${user.school || '-'}</td>
                <td>${user.role_name}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-view" onclick="userManager.viewUser('${user.id}')">
                            Xem
                        </button>
                        <button class="btn btn-edit" onclick="userManager.editUser('${user.id}')">
                            Sửa
                        </button>
                        <button class="btn btn-danger" onclick="userManager.deleteUser('${user.id}')">
                            Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async viewUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                credentials: 'include'
            });
            const user = await response.json();

            const avatarHtml = user.avatar
                ? `<img src="data:image/jpeg;base64,${user.avatar}" class="user-avatar" alt="User avatar">`
                : `<div class="user-avatar default-avatar">👤</div>`;

            const modalContent = `
                <div class="modal-content">
                    <span class="close" onclick="userManager.closeModal()">&times;</span>
                    <h2>Thông tin người dùng</h2>
                    <div class="avatar-container">
                        ${avatarHtml}
                    </div>
                    <div class="user-info">
                        <p><strong>ID:</strong> ${user.id}</p>
                        <p><strong>Tên đăng nhập:</strong> ${user.username}</p>
                        <p><strong>Họ và tên:</strong> ${user.full_name}</p>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Số điện thoại:</strong> ${user.phone || '-'}</p>
                        <p><strong>Địa chỉ:</strong> ${user.address || '-'}</p>
                        <p><strong>Trường:</strong> ${user.school || '-'}</p>
                        <p><strong>Vai trò:</strong> ${user.role_name}</p>
                        <p><strong>Trạng thái:</strong> ${user.status}</p>
                    </div>
                </div>
            `;

            this.showModal(modalContent);
        } catch (error) {
            console.error('Error loading user:', error);
            alert('Không thể tải thông tin người dùng');
        }
    }

    async editUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                credentials: 'include'
            });
            const user = await response.json();

            const avatarHtml = user.avatar
                ? `<img src="data:image/jpeg;base64,${user.avatar}" class="user-avatar" alt="Current avatar">`
                : `<div class="user-avatar default-avatar">👤</div>`;

            const modalContent = `
                <div class="modal-content">
                    <span class="close" onclick="userManager.closeModal()">&times;</span>
                    <h2>Chỉnh sửa thông tin người dùng</h2>
                    <form id="editUserForm" onsubmit="userManager.handleEdit(event, '${userId}')">
                        <div class="avatar-container">
                            ${avatarHtml}
                            <div class="form-group">
                                <label>Thay đổi avatar:</label>
                                <input type="file" name="avatar" accept="image/*" onchange="userManager.previewImage(this)">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Tên đăng nhập:</label>
                            <input type="text" name="username" value="${user.username}" required>
                        </div>
                        <div class="form-group">
                            <label>Email:</label>
                            <input type="email" name="email" value="${user.email}" required>
                        </div>
                        <div class="form-group">
                            <label>Họ và tên:</label>
                            <input type="text" name="full_name" value="${user.full_name}" required>
                        </div>
                        <div class="form-group">
                            <label>Số điện thoại:</label>
                            <input type="tel" name="phone" value="${user.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>Địa chỉ:</label>
                            <input type="text" name="address" value="${user.address || ''}">
                        </div>
                        <div class="form-group">
                            <label>Trường:</label>
                            <input type="text" name="school" value="${user.school || ''}">
                        </div>
                        <div class="form-group">
                            <label>Vai trò:</label>
                            <select name="role_id" required>
                                <option value="1" ${user.role_id === 1 ? 'selected' : ''}>Admin</option>
                                <option value="2" ${user.role_id === 2 ? 'selected' : ''}>User</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Trạng thái:</label>
                            <select name="status" required>
                                <option value="active" ${user.status === 'active' ? 'selected' : ''}>Hoạt động</option>
                                <option value="locked" ${user.status === 'locked' ? 'selected' : ''}>Khóa</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
                    </form>
                </div>
            `;

            this.showModal(modalContent);
        } catch (error) {
            console.error('Error loading user:', error);
            alert('Không thể tải thông tin người dùng');
        }
    }

    previewImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const avatarContainer = input.closest('.avatar-container');
                const currentAvatar = avatarContainer.querySelector('.user-avatar');
                if (currentAvatar) {
                    currentAvatar.src = e.target.result;
                    currentAvatar.classList.remove('default-avatar');
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    async handleEdit(event, userId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to update user');
            }

            await this.loadUsers();
            this.closeModal();
            alert('Cập nhật thông tin người dùng thành công');
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Không thể cập nhật thông tin người dùng');
        }
    }

    async deleteUser(userId) {
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

            await this.loadUsers();
            alert('Đã xóa tài khoản thành công');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Không thể xóa tài khoản');
        }
    }

    searchUsers() {
        const searchTerm = document.getElementById('searchUsername').value.toLowerCase();
        const filteredUsers = this.users.filter(user =>
            user.role_id.toString() === this.currentRole &&
            (user.username.toLowerCase().includes(searchTerm) ||
                user.full_name.toLowerCase().includes(searchTerm))
        );
        this.renderUsers(filteredUsers);
    }

    showCreateModal() {
        const modal = document.getElementById('createUserModal');
        if (modal) {
            modal.style.display = 'block';

            // Thêm event listener cho nút đóng
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.onclick = () => this.closeCreateModal();
            }

            // Thêm event listener cho click bên ngoài modal
            window.onclick = (event) => {
                if (event.target === modal) {
                    this.closeCreateModal();
                }
            };
        }
    }

    async handleCreate(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to create user');
            }

            await this.loadUsers();
            this.closeCreateModal(); // Thêm dòng này để đóng modal
            form.reset(); // Reset form
            alert('Tạo tài khoản thành công');
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Không thể tạo tài khoản');
        }
    }

    closeCreateModal() {
        const modal = document.getElementById('createUserModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form khi đóng modal
            const form = document.getElementById('createUserForm');
            if (form) {
                form.reset();
            }
        }
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentRole = tab.dataset.role;
                this.filterAndRenderUsers();
            });
        });

        // Modal events
        const modal = document.getElementById('createUserModal');
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => this.closeModal();
        window.onclick = (event) => {
            if (event.target === modal) this.closeModal();
        };

        // Form submission
        const createForm = document.getElementById('createUserForm');
        createForm.onsubmit = (e) => this.handleCreate(e);

        // Search functionality
        const searchInput = document.getElementById('searchUsername');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchUsers());
        }
    }

    showModal(content) {
        const modal = document.getElementById('userModal');
        if (!modal) {
            const modalDiv = document.createElement('div');
            modalDiv.id = 'userModal';
            modalDiv.className = 'modal';
            document.body.appendChild(modalDiv);
        }
        document.getElementById('userModal').innerHTML = content;
        document.getElementById('userModal').style.display = 'block';

        // Thêm event listener cho nút đóng modal chi tiết/chỉnh sửa
        const closeBtn = document.querySelector('#userModal .close');
        if (closeBtn) {
            closeBtn.onclick = () => this.closeModal();
        }

        // Thêm event listener cho click bên ngoài modal chi tiết/chỉnh sửa
        const userModal = document.getElementById('userModal');
        window.onclick = (event) => {
            if (event.target === userModal) {
                this.closeModal();
            }
        };
    }

    closeModal() {
        const modal = document.getElementById('userModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.user-management') && !window.userManager) {
        window.userManager = new UserManager();
    }
});

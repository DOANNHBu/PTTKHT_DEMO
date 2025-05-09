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
                    <button class="btn btn-danger" onclick="userManager.deleteUser('${user.id}')">
                        Xóa
                    </button>
                </td>
            </tr>
        `).join('');
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
        modal.style.display = 'block';
    }

    async handleCreate(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                credentials: 'include',
                body: formData // Gửi trực tiếp FormData để hỗ trợ upload file
            });

            if (!response.ok) {
                throw new Error('Failed to create user');
            }

            await this.loadUsers();
            this.closeModal();
            form.reset();
            alert('Tạo tài khoản thành công');
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Không thể tạo tài khoản');
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

    closeModal() {
        document.getElementById('createUserModal').style.display = 'none';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.user-management') && !window.userManager) {
        window.userManager = new UserManager();
    }
});
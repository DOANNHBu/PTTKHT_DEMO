class UserManager {
    constructor() {
        this.users = [];
        this.currentRole = '2'; // Default to student
        this.initializeEventListeners();
        this.loadUsers();
    }

    async loadUsers() {
        try {
            const response = await fetch('http://localhost:3000/users');
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
                <td>${user.class_name || '-'}</td>
                <td>
                    <span class="status-badge status-${user.status}">
                        ${this.formatStatus(user.status)}
                    </span>
                </td>
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
            const response = await fetch(`http://localhost:3000/users/${userId}`, {
                method: 'DELETE'
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
            user.username.toLowerCase().includes(searchTerm)
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
            const response = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password'),
                    full_name: formData.get('full_name'),
                    email: formData.get('email'),
                    class_name: formData.get('class_name'),
                    school_name: formData.get('school_name'),
                    role_id: formData.get('role_id'),
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('Failed to create user');

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

        // Role selection for class field visibility
        const roleSelect = createForm.querySelector('[name="role_id"]');
        roleSelect.onchange = (e) => {
            const studentOnly = document.querySelector('.student-only');
            studentOnly.style.display = e.target.value === '2' ? 'block' : 'none';
        };
    }

    closeModal() {
        document.getElementById('createUserModal').style.display = 'none';
    }

    formatStatus(status) {
        return {
            'active': 'Hoạt động',
            'deleted': 'Đã xóa'
        }[status] || status;
    }
}

// Initialize
// const userManager = new UserManager();
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.user-management') && !window.userManager) {
        window.userManager = new UserManager();
    }
});
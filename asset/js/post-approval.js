class PostApproval {
    constructor() {
        this.posts = [];
        this.currentPost = null;
        this.currentFilter = {
            status: 'all',
            searchText: ''
        };
    }

    async initialize() {
        await this.loadPendingPosts();
    }

    async loadPendingPosts() {
        try {
            const response = await fetch('/api/admin/posts', {
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            this.posts = await response.json();
            this.filterAndRenderPosts();
            this.setupFilters();
        } catch (error) {
            console.error('Error loading posts:', error);
            alert('Không thể tải danh sách bài đăng');
        }
    }

    setupFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchPost');

        if (statusFilter) {
            // Khôi phục trạng thái filter
            statusFilter.value = this.currentFilter.status;
            statusFilter.addEventListener('change', () => {
                this.currentFilter.status = statusFilter.value;
                this.filterAndRenderPosts();
            });
        }

        if (searchInput) {
            // Khôi phục từ khóa tìm kiếm
            searchInput.value = this.currentFilter.searchText;
            searchInput.addEventListener('input', () => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.currentFilter.searchText = searchInput.value;
                    this.filterAndRenderPosts();
                }, 300);
            });
        }
    }

    filterAndRenderPosts() {
        let filteredPosts = [...this.posts];

        // Lọc theo trạng thái
        if (this.currentFilter.status !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.status === this.currentFilter.status);
        }

        // Lọc theo từ khóa tìm kiếm
        const searchText = this.currentFilter.searchText.toLowerCase().trim();
        if (searchText) {
            filteredPosts = filteredPosts.filter(post =>
                post.title.toLowerCase().includes(searchText) ||
                post.author_name.toLowerCase().includes(searchText) ||
                (post.category_name && post.category_name.toLowerCase().includes(searchText))
            );
        }

        this.renderPosts(filteredPosts);
    }

    renderPosts(posts) {
        const container = document.getElementById('posts-table');
        if (!container) return;

        if (posts.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Không tìm thấy bài đăng nào</td>
                </tr>
            `;
            return;
        }

        container.innerHTML = posts.map(post => `
            <tr>
                <td>${post.title}</td>
                <td>${post.author_name}</td>
                <td>${post.category_name || ''}</td>
                <td>${new Date(post.created_at).toLocaleDateString()}</td>
                <td>${this.getStatusBadge(post.status)}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="postApproval.showPostDetail('${post.id}')" class="btn btn-info">
                            Xem
                        </button>
                        <button onclick="postApproval.showEditForm('${post.id}')" class="btn btn-warning">
                            Sửa
                        </button>
                        <button onclick="postApproval.deletePost('${post.id}')" class="btn btn-danger">
                            Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getStatusBadge(status) {
        const badges = {
            pending: '<span class="badge badge-warning">Chờ duyệt</span>',
            approved: '<span class="badge badge-success">Đã duyệt</span>',
            rejected: '<span class="badge badge-danger">Từ chối</span>'
        };
        return badges[status] || '';
    }

    async showPostDetail(postId) {
        try {
            const response = await fetch(`/api/admin/posts/${postId}`, {
                credentials: 'include'
            });
            const post = await response.json();

            const modal = document.getElementById('postDetailModal');
            modal.style.display = 'block'; // Thay đổi thành block thay vì flex

            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${post.title}</h3>
                        <span class="close" onclick="postApproval.closeModal()">&times;</span>
                    </div>
                    <div class="post-detail-content">
                        <p><strong>Người đăng:</strong> ${post.author_name}</p>
                        <p><strong>Danh mục:</strong> ${post.category_name}</p>
                        <p><strong>Giá:</strong> ${post.price.toLocaleString('vi-VN')} đ</p>
                        <p><strong>Địa điểm:</strong> ${post.location}</p>
                        <p><strong>Ngày đăng:</strong> ${post.created_at}</p>
                        <p><strong>Ngày duyệt:</strong> ${post.status_update_date ? post.status_update_date : ''}</p>
                        <p><strong>Trạng thái:</strong> ${this.getStatusBadge(post.status)}</p>
                        
                        <div class="post-description">
                            <h4>Mô tả:</h4>
                            <p>${post.description}</p>
                        </div>
                        
                        ${post.images && post.images.length > 0 ? `
                            <div class="post-images">
                                ${post.images.map(img => `
                                    <img src="${img.image_url}" class="post-image" alt="Post image" 
                                        onclick="postApproval.showFullImage(this.src)">
                                `).join('')}
                            </div>
                        ` : '<p>Không có hình ảnh</p>'}
                    </div>
                    
                    ${post.status === 'pending' ? `
                        <div class="post-actions">
                            <button onclick="postApproval.approvePost('${post.id}')" class="btn btn-success">
                                Duyệt
                            </button>
                            <button onclick="postApproval.showRejectionForm('${post.id}')" class="btn btn-danger">
                                Từ chối
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;

            // Thêm event listener để đóng modal khi click bên ngoài
            window.onclick = (event) => {
                if (event.target === modal) {
                    this.closeModal();
                }
            };
        } catch (error) {
            console.error('Error loading post detail:', error);
            alert('Không thể tải thông tin bài đăng');
        }
    }

    getStatusText(status) {
        const statusMap = {
            pending: 'Chờ duyệt',
            approved: 'Đã duyệt',
            rejected: 'Từ chối',
            deleted: 'Đã xóa'
        };
        return statusMap[status] || status;
    }

    showFullImage(src) {
        const fullImageModal = document.createElement('div');
        fullImageModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            cursor: pointer;
        `;

        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        `;

        fullImageModal.appendChild(img);
        document.body.appendChild(fullImageModal);

        fullImageModal.onclick = () => {
            document.body.removeChild(fullImageModal);
        };
    }

    async approvePost(postId) {
        try {
            const response = await fetch(`/api/admin/posts/${postId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    status: 'approved'
                })
            });

            if (response.ok) {
                this.closeModal();
                await this.loadPendingPosts(); // Tải lại dữ liệu
                // Không cần gọi filterAndRenderPosts() vì đã được gọi trong loadPendingPosts
                alert('Đã duyệt bài thành công!');
            } else {
                throw new Error('Failed to approve post');
            }
        } catch (error) {
            console.error('Error approving post:', error);
            alert('Có lỗi xảy ra khi duyệt bài đăng!');
        }
    }

    showRejectionForm(postId) {
        const modal = document.getElementById('postDetailModal');
        const content = modal.querySelector('.modal-content');

        // Xóa form từ chối cũ nếu có
        const oldForm = content.querySelector('.rejection-form');
        if (oldForm) oldForm.remove();

        // Thêm form từ chối mới
        const rejectionForm = document.createElement('div');
        rejectionForm.className = 'rejection-form';
        rejectionForm.innerHTML = `
            <h4>Lý do từ chối</h4>
            <textarea id="rejectionReason" required 
                placeholder="Nhập lý do từ chối bài đăng..."></textarea>
            <div class="post-actions">
                <button onclick="postApproval.rejectPost('${postId}')" class="btn btn-danger">
                    Xác nhận từ chối
                </button>
            </div>
        `;

        content.appendChild(rejectionForm);
    }

    async rejectPost(postId) {
        const reason = document.getElementById('rejectionReason').value;
        if (!reason) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }

        try {
            const response = await fetch(`/api/admin/posts/${postId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    status: 'rejected',
                    rejection_reason: reason
                })
            });

            if (response.ok) {
                this.closeModal();
                await this.loadPendingPosts();
                alert('Đã từ chối bài đăng');
            } else {
                throw new Error('Failed to reject post');
            }
        } catch (error) {
            console.error('Error rejecting post:', error);
            alert('Không thể từ chối bài đăng');
        }
    }

    closeModal() {
        const modal = document.getElementById('postDetailModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async showEditForm(postId) {
        try {
            const response = await fetch(`/api/admin/posts/${postId}`, {
                credentials: 'include'
            });
            const post = await response.json();

            const modal = document.getElementById('postDetailModal');
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">Chỉnh sửa bài đăng</h3>
                        <span class="close" onclick="postApproval.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="editPostForm" onsubmit="postApproval.handleEdit(event, '${post.id}')">
                            <div class="form-group">
                                <label>Tiêu đề:</label>
                                <input type="text" name="title" value="${post.title}" required>
                            </div>
                            <div class="form-group">
                                <label>Mô tả:</label>
                                <textarea name="description" required>${post.description}</textarea>
                            </div>
                            <div class="form-group">
                                <label>Giá:</label>
                                <input type="number" name="price" value="${post.price}" required>
                            </div>
                            <div class="form-group">
                                <label>Địa điểm:</label>
                                <input type="text" name="location" value="${post.location}" required>
                            </div>
                            <div class="form-group">
                                <label>Trạng thái:</label>
                                <select name="status" required>
                                    <option value="pending" ${post.status === 'pending' ? 'selected' : ''}>Chờ duyệt</option>
                                    <option value="approved" ${post.status === 'approved' ? 'selected' : ''}>Duyệt</option>
                                    <option value="rejected" ${post.status === 'rejected' ? 'selected' : ''}>Từ chối</option>
                                </select>
                            </div>
                            <div class="form-group rejection-reason" style="display: none;">
                                <label>Lý do từ chối:</label>
                                <textarea name="rejection_reason">${post.rejection_reason || ''}</textarea>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            modal.style.display = 'block';

            // Hiển thị/ẩn trường lý do từ chối dựa trên trạng thái
            const statusSelect = modal.querySelector('select[name="status"]');
            const rejectionReasonDiv = modal.querySelector('.rejection-reason');

            statusSelect.addEventListener('change', (e) => {
                rejectionReasonDiv.style.display = e.target.value === 'rejected' ? 'block' : 'none';
            });

        } catch (error) {
            console.error('Error loading post for edit:', error);
            alert('Không thể tải thông tin bài đăng');
        }
    }

    async handleEdit(event, postId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        try {
            const response = await fetch(`/api/admin/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (!response.ok) {
                throw new Error('Failed to update post');
            }

            this.closeModal();
            await this.loadPendingPosts();
            alert('Cập nhật bài đăng thành công!');
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Có lỗi xảy ra khi cập nhật bài đăng!');
        }
    }

    async deletePost(postId) {
        if (!confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/posts/${postId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to delete post');
            }

            await this.loadPendingPosts();
            alert('Xóa bài đăng thành công!');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Có lỗi xảy ra khi xóa bài đăng!');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.postApproval = new PostApproval();
    postApproval.loadPendingPosts();
});
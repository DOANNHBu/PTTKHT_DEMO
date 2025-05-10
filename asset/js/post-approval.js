class PostApproval {
    constructor() {
        this.posts = [];
        this.currentPost = null;
    }

    async loadPendingPosts() {
        try {
            const response = await fetch('/api/admin/posts', {
                credentials: 'include'
            });
            const data = await response.json();
            this.posts = data;
            this.renderPosts();
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    renderPosts() {
        const container = document.getElementById('posts-table');
        container.innerHTML = this.posts.map(post => `
            <tr>
                <td>${post.title}</td>
                <td>${post.author_name}</td>
                <td>${new Date(post.created_at).toLocaleDateString()}</td>
                <td>${this.getStatusBadge(post.status)}</td>
                <td>
                    <button onclick="postApproval.showPostDetail('${post.id}')" class="btn btn-info">
                        Xem
                    </button>
                    ${post.status === 'pending' ? `
                        <button onclick="postApproval.approvePost('${post.id}')" class="btn-approve">
                            Duyệt
                        </button>
                        <button onclick="postApproval.showRejectionForm('${post.id}')" class="btn-reject">
                            Từ chối
                        </button>
                    ` : ''}
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

            if (!post) {
                alert('Không tìm thấy thông tin bài đăng!');
                return;
            }

            const modal = document.getElementById('postDetailModal');
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${post.title}</h3>
                        <button class="modal-close" onclick="postApproval.closeModal()">&times;</button>
                    </div>
                    <div class="post-detail-content">
                        <div class="post-detail-meta">
                            <div class="meta-item">
                                <span class="meta-label">Người đăng</span>
                                <span class="meta-value">${post.author_name}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Danh mục</span>
                                <span class="meta-value">${post.category_name}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Ngày đăng</span>
                                <span class="meta-value">${new Date(post.created_at).toLocaleString()}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Giá</span>
                                <span class="meta-value">${post.price === 0 ? 'Thỏa thuận' : post.price.toLocaleString('vi-VN') + ' đ'}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Địa điểm</span>
                                <span class="meta-value">${post.location}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Trạng thái</span>
                                <span class="meta-value">${this.getStatusText(post.status)}</span>
                            </div>
                        </div>
                        <div class="post-description">
                            <h4>Mô tả</h4>
                            <p>${post.description}</p>
                        </div>
                        ${post.images && post.images.length > 0 ? `
                            <div class="post-images">
                                ${post.images.map(img => `
                                    <img src="${img.image_url}" class="post-image" alt="Post image" onclick="postApproval.showFullImage(this.src)">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    ${post.status === 'pending' ? `
                    <div class="post-actions">
                            <button onclick="postApproval.approvePost('${post.id}')" class="btn-approve">
                            Duyệt bài
                        </button>
                            <button onclick="postApproval.showRejectionForm('${post.id}')" class="btn-reject">
                            Từ chối
                        </button>
                        <button onclick="postApproval.closeModal()" class="btn-close">
                            Đóng
                        </button>
                    </div>
                    ` : `
                        <div class="post-actions">
                            <button onclick="postApproval.closeModal()" class="btn-close">
                                Đóng
                            </button>
                        </div>
                    `}
                </div>
            `;
            modal.style.display = 'block';
        } catch (error) {
            console.error('Error loading post detail:', error);
            alert('Có lỗi xảy ra khi tải thông tin bài đăng!');
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
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
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
        
        modal.appendChild(img);
        document.body.appendChild(modal);
        
        modal.onclick = () => {
            document.body.removeChild(modal);
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
                this.loadPendingPosts();
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
        const rejectionForm = document.createElement('div');
        rejectionForm.className = 'rejection-form';
        rejectionForm.innerHTML = `
                <h4>Lý do từ chối</h4>
            <textarea id="rejectionReason" required placeholder="Nhập lý do từ chối bài đăng..."></textarea>
            <button onclick="postApproval.rejectPost('${postId}')" class="btn-reject">
                    Xác nhận từ chối
                </button>
        `;
        
        const existingForm = modal.querySelector('.rejection-form');
        if (existingForm) {
            existingForm.remove();
        }
        
        modal.querySelector('.modal-content').appendChild(rejectionForm);
    }

    async rejectPost(postId) {
        const reason = document.getElementById('rejectionReason').value;
        if (!reason) {
            alert('Vui lòng nhập lý do từ chối!');
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
                this.loadPendingPosts();
            alert('Đã từ chối bài đăng!');
            } else {
                throw new Error('Failed to reject post');
            }
        } catch (error) {
            console.error('Error rejecting post:', error);
            alert('Có lỗi xảy ra khi từ chối bài đăng!');
        }
    }

    closeModal() {
        const modal = document.getElementById('postDetailModal');
        modal.style.display = 'none';
    }
}

// Khởi tạo và gắn vào window
const postApproval = new PostApproval();
window.postApproval = postApproval;

// Load dữ liệu khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    postApproval.loadPendingPosts();
});
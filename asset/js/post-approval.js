class PostApproval {
    constructor() {
        this.posts = [];
        this.currentPost = null;
    }

    async loadPendingPosts() {
        try {
            // Thay đổi để load từ file JSON local
            const response = await fetch('/asset/json/posts.json');
            const data = await response.json();
            // Lọc chỉ lấy các bài đang pending
            this.posts = data.posts.filter(post => post.status === 'pending');
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
                    <button onclick="postApproval.showPostDetail(${post.id})" class="btn btn-info">
                        Xem chi tiết
                    </button>
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
            // Load từ JSON thay vì API
            const response = await fetch('/asset/json/posts.json');
            const data = await response.json();
            this.currentPost = data.posts.find(p => p.id === postId);

            if (!this.currentPost) {
                alert('Bài đăng không tồn tại hoặc đã được xử lý!');
                return;
            }

            const modal = document.getElementById('postDetailModal');
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>${this.currentPost.title}</h3>
                    <div class="post-meta">
                        <p>Người đăng: ${this.currentPost.author_name}</p>
                        <p>Ngày đăng: ${new Date(this.currentPost.created_at).toLocaleString()}</p>
                        <p>Giá: ${this.currentPost.price.toLocaleString('vi-VN')} đ</p>
                        <p>Địa điểm: ${this.currentPost.location}</p>
                    </div>
                    <div class="post-content">
                        <p>${this.currentPost.description}</p>
                        <div class="post-images">
                            ${this.currentPost.images.map(img =>
                `<img src="${img.image_url}" class="post-image" alt="Post image">`
            ).join('')}
                        </div>
                    </div>
                    <div class="post-actions">
                        <button onclick="postApproval.approvePost(${postId})" class="btn-approve">
                            Duyệt bài
                        </button>
                        <button onclick="postApproval.showRejectionForm(${postId})" class="btn-reject">
                            Từ chối
                        </button>
                        <button onclick="postApproval.closeModal()" class="btn-close">
                            Đóng
                        </button>
                    </div>
                </div>
            `;
            modal.style.display = 'block';
        } catch (error) {
            console.error('Error loading post detail:', error);
        }
    }

    async approvePost(postId) {
        try {
            // Giả lập cập nhật trạng thái
            const postIndex = this.posts.findIndex(p => p.id === postId);
            if (postIndex > -1) {
                this.posts.splice(postIndex, 1);
            }
            this.closeModal();
            this.renderPosts();
            alert('Đã duyệt bài thành công!');
        } catch (error) {
            console.error('Error approving post:', error);
        }
    }

    showRejectionForm(postId) {
        const modal = document.getElementById('postDetailModal');
        modal.innerHTML += `
            <div class="rejection-form">
                <h4>Lý do từ chối</h4>
                <textarea id="rejectionReason" required></textarea>
                <button onclick="postApproval.rejectPost(${postId})" class="btn-reject">
                    Xác nhận từ chối
                </button>
            </div>
        `;
    }

    async rejectPost(postId) {
        const reason = document.getElementById('rejectionReason').value;
        if (!reason) {
            alert('Vui lòng nhập lý do từ chối!');
            return;
        }

        try {
            // Giả lập cập nhật trạng thái
            const postIndex = this.posts.findIndex(p => p.id === postId);
            if (postIndex > -1) {
                this.posts.splice(postIndex, 1);
            }
            this.closeModal();
            this.renderPosts();
            alert('Đã từ chối bài đăng!');
        } catch (error) {
            console.error('Error rejecting post:', error);
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
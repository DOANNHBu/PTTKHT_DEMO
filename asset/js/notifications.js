class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.initialize();
    }

    async initialize() {
        // Thêm event listener trực tiếp cho nút thông báo
        document.addEventListener('click', (e) => {
            if (e.target.closest('#notificationsBtn')) {
                this.toggleDropdown();
            } else if (!e.target.closest('.notifications-dropdown')) {
                this.closeDropdown();
            }
        });

        // Event listener cho nút đánh dấu đã đọc tất cả
        document.addEventListener('click', (e) => {
            if (e.target.id === 'markAllRead') {
                this.markAllAsRead();
            }
        });

        // Load initial notifications
        await this.loadNotifications();

        // Start polling for new notifications
        this.startPolling();
    }

    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications', {
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to fetch notifications');

            this.notifications = await response.json();
            this.unreadCount = this.notifications.filter(n => !n.is_read).length;

            this.updateBadge();
            this.renderNotifications();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
        }
    }

    // Cập nhật phương thức renderNotifications để thêm xử lý click
    renderNotifications() {
        const list = document.getElementById('notificationsList');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="notification-item">Không có thông báo nào</div>';
            return;
        }

        list.innerHTML = this.notifications
            .map(notification => `
                <div class="notification-item ${notification.is_read ? '' : 'unread'}"
                     onclick="notificationManager.handleNotificationClick(${JSON.stringify(notification).replace(/"/g, '&quot;')})">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.created_at)}</div>
                </div>
            `)
            .join('');
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to mark notification as read');

            await this.loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'PUT',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to mark all notifications as read');

            await this.loadNotifications();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    toggleDropdown() {
        const dropdown = document.querySelector('.notifications-dropdown');
        if (dropdown) {
            const currentDisplay = window.getComputedStyle(dropdown).display;
            dropdown.style.display = currentDisplay === 'none' ? 'block' : 'none';
        }
    }

    closeDropdown() {
        const dropdown = document.querySelector('.notifications-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleString('vi-VN');
    }

    startPolling() {
        // Check for new notifications every 30 seconds
        setInterval(() => this.loadNotifications(), 30000);
    }

    async showNotificationDetail(notification) {
        this.closeDropdown();

        try {
            let detailContent = '';

            switch (notification.type) {
                case 'post_approval':
                    if (notification.post_id) {
                        const post = await this.fetchPostDetail(notification.post_id);
                        detailContent = this.renderPostDetail(post);
                    }
                    break;

                case 'activity_update':
                    if (notification.activity_id) {
                        const activity = await this.fetchActivityDetail(notification.activity_id);
                        detailContent = this.renderActivityDetail(activity);
                    }
                    break;

                case 'system':
                    detailContent = `
                        <div class="system-notification">
                            <h2>${notification.title}</h2>
                            <div class="content-section">
                                <p>${notification.message}</p>
                            </div>
                            <div class="meta-info">
                                <p><strong>Thời gian:</strong> ${this.formatTime(notification.created_at)}</p>
                            </div>
                        </div>
                    `;
                    break;
            }

            const modal = document.getElementById('notification-detail-modal');
            const contentDiv = modal.querySelector('.notification-detail-content');
            contentDiv.innerHTML = detailContent || 'Không thể tải thông tin chi tiết';
            modal.style.display = 'block';

            const closeBtn = document.getElementById('close-notification-modal');
            closeBtn.onclick = () => modal.style.display = 'none';
            window.onclick = (event) => {
                if (event.target === modal) modal.style.display = 'none';
            };

        } catch (error) {
            console.error('Error showing notification detail:', error);
            alert('Không thể tải thông tin chi tiết. Vui lòng thử lại sau.');
        }
    }

    // Hàm lấy ID bài đăng từ nội dung thông báo
    extractPostId(message) {
        try {
            const quotedContent = message.match(/"([^"]+)"/);
            if (quotedContent) {
                // Lấy title từ message
                const title = quotedContent[1];
                // Tìm bài đăng có title này trong this.notifications
                const notification = this.notifications.find(n =>
                    n.message.includes(title) &&
                    n.type === 'post_approval'
                );
                if (notification) {
                    // ID bài đăng được lưu trong notification.post_id
                    return notification.post_id;
                }
            }
            return null;
        } catch (error) {
            console.error('Error extracting post ID:', error);
            return null;
        }
    }

    // Hàm lấy ID hoạt động từ nội dung thông báo
    extractActivityId(message) {
        try {
            const quotedContent = message.match(/"([^"]+)"/);
            if (quotedContent) {
                // Lấy title từ message
                const title = quotedContent[1];
                // Tìm hoạt động có title này trong this.notifications
                const notification = this.notifications.find(n =>
                    n.message.includes(title) &&
                    n.type === 'activity_update'
                );
                if (notification) {
                    // ID hoạt động được lưu trong notification.activity_id
                    return notification.activity_id;
                }
            }
            return null;
        } catch (error) {
            console.error('Error extracting activity ID:', error);
            return null;
        }
    }

    // Hàm lấy thông tin chi tiết bài đăng
    async fetchPostDetail(postId) {
        const response = await fetch(`/api/posts/${postId}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch post details');
        return await response.json();
    }

    // Hàm lấy thông tin chi tiết hoạt động
    async fetchActivityDetail(activityId) {
        const response = await fetch(`/api/public/activities/${activityId}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch activity details');
        return await response.json();
    }

    // Hàm render chi tiết bài đăng
    renderPostDetail(post) {
        return `
            <h2>${post.title}</h2>
            <div class="meta-info">
                <p><strong>Người đăng:</strong> ${post.seller}</p>
                <p><strong>Danh mục:</strong> ${post.categoryName}</p>
                <p><strong>Giá:</strong> ${this.formatPrice(post.price)}</p>
                <p><strong>Vị trí:</strong> ${post.location}</p>
                <p><strong>Trạng thái:</strong> 
                    <span class="status-badge status-${post.status}">
                        ${this.formatStatus(post.status)}
                    </span>
                </p>
                ${post.rejection_reason ? `<p><strong>Lý do từ chối:</strong> ${post.rejection_reason}</p>` : ''}
            </div>
            <div class="content-section">
                <h3>Mô tả</h3>
                <p>${post.description}</p>
            </div>
            ${this.renderImages(post.images)}
        `;
    }

    // Hàm render chi tiết hoạt động
    renderActivityDetail(activity) {
        return `
            <h2>${activity.title}</h2>
            <div class="meta-info">
                <p><strong>Thời gian:</strong> ${this.formatDateRange(activity.start_date, activity.end_date)}</p>
                <p><strong>Địa điểm:</strong> ${activity.location}</p>
                <p><strong>Đơn vị tổ chức:</strong> ${activity.name_organizer}</p>
            </div>
            <div class="content-section">
                <h3>Mô tả</h3>
                <p>${activity.description}</p>
            </div>
            ${activity.guidelines ? `
                <div class="content-section">
                    <h3>Hướng dẫn</h3>
                    <p>${activity.guidelines}</p>
                </div>
            ` : ''}
            ${this.renderActivityItems(activity.items)}
        `;
    }

    // Hàm render danh sách vật phẩm của hoạt động
    renderActivityItems(items) {
        if (!items || items.length === 0) return '';

        return `
            <div class="content-section">
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
                        ${items.map(item => `
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
        `;
    }

    // Các hàm tiện ích
    formatPrice(price) {
        return price ? new Intl.NumberFormat('vi-VN').format(price) + ' đ' : 'Thỏa thuận';
    }

    formatStatus(status) {
        const statusMap = {
            'pending': 'Chờ duyệt',
            'approved': 'Đã duyệt',
            'rejected': 'Từ chối',
            'deleted': 'Đã xóa'
        };
        return statusMap[status] || status;
    }

    formatDateRange(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`;
    }

    renderImages(images) {
        if (!images || images.length === 0) return '';

        return `
            <div class="content-section">
                <h3>Hình ảnh</h3>
                <div class="image-gallery">
                    ${images.map(img => `
                        <img src="${img.data}" alt="Ảnh sản phẩm" />
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Thêm phương thức xử lý click vào thông báo
    async handleNotificationClick(notification) {
        await this.markAsRead(notification.id);
        await this.showNotificationDetail(notification);
    }
}

// Thêm khởi tạo toàn cục
window.NotificationManager = NotificationManager;
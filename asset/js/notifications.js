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
                     onclick="notificationManager.markAsRead(${notification.id})">
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
}

// Thêm khởi tạo toàn cục
window.NotificationManager = NotificationManager;
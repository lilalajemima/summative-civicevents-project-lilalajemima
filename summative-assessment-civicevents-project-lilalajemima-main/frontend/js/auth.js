// Authentication Module
const Auth = {
    // Get current user
    getUser: () => Storage.get(CONFIG.USER_KEY),
    
    // Get token
    getToken: () => Storage.get(CONFIG.TOKEN_KEY),
    
    // Check if logged in
    isLoggedIn: () => !!Auth.getToken(),
    
    // Check if admin
    isAdmin: () => {
        const user = Auth.getUser();
        return user && user.role === 'admin';
    },
    
    // Login
    login: async (email, password) => {
        const res = await API.post('/auth/login', { email, password });
        if (res.status === 200 && res.data) {
            Storage.set(CONFIG.TOKEN_KEY, res.data.token);
            Storage.set(CONFIG.USER_KEY, res.data.user);
            return { success: true, user: res.data.user };
        }
        return { success: false, message: res.message || 'Login failed' };
    },
    
    // Signup
    signup: async (data) => {
        const res = await API.post('/auth/signup', data);
        if (res.status === 201) {
            return { success: true, message: 'Account created successfully!' };
        }
        return { success: false, message: res.message || 'Signup failed' };
    },
    
    // Logout
    logout: () => {
        Storage.clear();
        window.location.href = 'login.html';
    },
    
    // Require auth (redirect if not logged in)
    requireAuth: () => {
        if (!Auth.isLoggedIn()) {
            Utils.showToast('Please login to continue', 'warning');
            setTimeout(() => window.location.href = 'login.html', 1000);
            return false;
        }
        return true;
    },
    
    // Require admin
    requireAdmin: () => {
        if (!Auth.requireAuth()) return false;
        if (!Auth.isAdmin()) {
            Utils.showToast('Admin access required', 'error');
            setTimeout(() => window.location.href = 'index.html', 1000);
            return false;
        }
        return true;
    }
};

// Initialize auth state on page load
$(document).ready(function() {
    const user = Auth.getUser();
    
    if (user) {
        $('#auth-buttons').addClass('hidden');
        $('#user-menu').removeClass('hidden').addClass('flex');
        $('#user-initial').text(user.full_name.charAt(0).toUpperCase());
        $('#dropdown-name').text(user.full_name);
        $('#dropdown-email').text(user.email);
        $('#dropdown-role').text(user.role);
        
        if (user.role === 'admin') {
            $('#admin-links').removeClass('hidden');
        }
        
        // Load notifications
        loadNotifications();
    }
    
    // Profile dropdown toggle
    $('#profile-btn').on('click', function(e) {
        e.stopPropagation();
        $('#profile-dropdown').toggleClass('hidden');
    });
    
    $(document).on('click', function() {
        $('#profile-dropdown').addClass('hidden');
    });
    
    // Logout handler
    $('#logout-btn').on('click', function() {
        Auth.logout();
    });
    
    // Notification panel
    $('#notification-btn').on('click', function() {
        $('#notification-panel').removeClass('translate-x-full');
    });
    
    $('#close-notifications').on('click', function() {
        $('#notification-panel').addClass('translate-x-full');
    });
});

// Load notifications
async function loadNotifications() {
    if (!Auth.isLoggedIn()) return;
    
    try {
        const res = await API.get('/notifications');
        if (res.status === 200 && res.data) {
            const notifications = res.data;
            const unread = notifications.filter(n => !n.read).length;
            
            if (unread > 0) {
                $('#notification-count').text(unread).removeClass('hidden');
            } else {
                $('#notification-count').addClass('hidden');
            }
            
            renderNotifications(notifications);
        }
    } catch (err) {
        console.error('Failed to load notifications:', err);
    }
}

function renderNotifications(notifications) {
    const container = $('#notifications-list');
    
    if (notifications.length === 0) {
        container.html('<p class="text-center text-white/50 py-8">No notifications</p>');
        return;
    }
    
    const html = notifications.map(n => `
        <div class="p-4 glass rounded-xl cursor-pointer hover:bg-white/5 transition" data-id="${n.id}" data-type="${n.type}" data-metadata='${JSON.stringify(n.metadata || {})}'>
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-${getTypeColor(n.type)}/20 flex items-center justify-center flex-shrink-0">
                    ${getTypeIcon(n.type)}
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-sm">${n.title}</h4>
                    <p class="text-white/50 text-xs mt-1 line-clamp-2">${n.message}</p>
                    <p class="text-white/30 text-xs mt-2">${Utils.formatDate(n.created_at)}</p>
                </div>
                ${Auth.isAdmin() ? `<button class="delete-notification p-1 rounded hover:bg-danger/20 text-danger" data-id="${n.id}"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>` : ''}
            </div>
        </div>
    `).join('');
    
    container.html(html);
    
    // Click handler for notifications
    container.find('[data-id]').on('click', function(e) {
        if ($(e.target).closest('.delete-notification').length) return;
        
        const type = $(this).data('type');
        const metadata = $(this).data('metadata');
        
        if (type === 'event' && metadata.event_id) {
            window.location.href = `event-detail.html?id=${metadata.event_id}`;
        } else if (type === 'promo' && metadata.promo_id) {
            window.location.href = `promo-detail.html?id=${metadata.promo_id}`;
        } else if (type === 'announcement' && metadata.announcement_id) {
            window.location.href = `announcement-detail.html?id=${metadata.announcement_id}`;
        }
    });
    
    // Delete handler
    container.find('.delete-notification').on('click', async function(e) {
        e.stopPropagation();
        const id = $(this).data('id');
        
        try {
            const res = await API.delete(`/notifications/${id}`);
            if (res.status === 200) {
                $(this).closest('[data-id]').remove();
                Utils.showToast('Notification deleted', 'success');
                loadNotifications();
            }
        } catch (err) {
            Utils.showToast('Failed to delete notification', 'error');
        }
    });
}

function getTypeColor(type) {
    const colors = { event: 'primary', promo: 'accent', announcement: 'success', system: 'white' };
    return colors[type] || 'primary';
}

function getTypeIcon(type) {
    const icons = {
        event: '<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
        promo: '<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>',
        announcement: '<svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>',
        system: '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    return icons[type] || icons.system;
}
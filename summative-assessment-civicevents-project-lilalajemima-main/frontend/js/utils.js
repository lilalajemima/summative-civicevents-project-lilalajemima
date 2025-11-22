// Utility Functions
const Utils = {
    // Show toast notification
    showToast: (message, type = 'info') => {
        const colors = {
            success: 'bg-success',
            error: 'bg-danger',
            warning: 'bg-accent',
            info: 'bg-primary'
        };
        
        const icons = {
            success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
            error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
            warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
            info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        };
        
        const toast = $(`
            <div class="toast flex items-center gap-3 px-4 py-3 ${colors[type]} text-white rounded-xl shadow-lg max-w-sm">
                ${icons[type]}
                <span>${message}</span>
            </div>
        `);
        
        $('#toast-container').append(toast);
        
        setTimeout(() => {
            toast.animate({ opacity: 0, transform: 'translateX(100%)' }, 300, function() {
                $(this).remove();
            });
        }, 4000);
    },
    
    // Show loading overlay
    showLoading: () => $('#loading-overlay').removeClass('hidden'),
    
    // Hide loading overlay
    hideLoading: () => $('#loading-overlay').addClass('hidden'),
    
    // Format date
    formatDate: (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    },
    
    // Format date short
    formatDateShort: (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },
    
    // Format time
    formatTime: (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    },
    
    // Get URL parameter
    getParam: (name) => new URLSearchParams(window.location.search).get(name),
    
    // Password strength checker
    checkPasswordStrength: (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[\W_]/.test(password)) strength++;
        
        const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const colors = ['bg-danger', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-success'];
        
        return {
            score: strength,
            label: labels[strength - 1] || 'Very Weak',
            color: colors[strength - 1] || 'bg-danger',
            width: `${(strength / 5) * 100}%`
        };
    },
    
    // Validate email
    isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    
    // Truncate text
    truncate: (text, length = 100) => {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    },
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Skeleton loader HTML
    skeleton: (className = 'h-4 w-full') => `<div class="skeleton ${className} rounded"></div>`,
    
    // Render star rating
    renderStars: (rating) => {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<svg class="w-4 h-4 text-accent fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
            } else {
                stars += '<svg class="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
            }
        }
        return stars;
    },
    
    // Calculate average rating
    calculateAverage: (feedbacks) => {
        if (!feedbacks || feedbacks.length === 0) return 0;
        const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
        return (sum / feedbacks.length).toFixed(1);
    }
};
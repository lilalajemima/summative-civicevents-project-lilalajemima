// API Module - Handles all HTTP requests to the backend
const API = {
    // GET request
    get: async (endpoint) => {
        return API.request(endpoint, { method: 'GET' });
    },
    
    // POST request
    post: async (endpoint, data) => {
        return API.request(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },
    
    // PUT request
    put: async (endpoint, data) => {
        return API.request(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },
    
    // PATCH request
    patch: async (endpoint, data) => {
        return API.request(endpoint, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },
    
    // DELETE request
    delete: async (endpoint) => {
        return API.request(endpoint, { method: 'DELETE' });
    },
    
    // Upload file (multipart/form-data)
    upload: async (endpoint, formData, method = 'POST') => {
        return API.request(endpoint, {
            method: method,
            body: formData
            // Note: Don't set Content-Type header - browser sets it with boundary
        });
    },
    
    // Base request handler
    request: async (endpoint, options = {}) => {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const token = Storage.get(CONFIG.TOKEN_KEY);
        
        // Add auth header if token exists
        if (token) {
            options.headers = options.headers || {};
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        try {
            Utils.showLoading();
            const response = await fetch(url, options);
            const data = await response.json();
            Utils.hideLoading();
            
            // Handle unauthorized (expired token)
            if (response.status === 401) {
                Storage.clear();
                Utils.showToast('Session expired. Please login again.', 'warning');
                setTimeout(() => window.location.href = 'login.html', 1500);
                return data;
            }
            
            // Handle forbidden
            if (response.status === 403) {
                Utils.showToast('Access denied. Insufficient permissions.', 'error');
                return data;
            }
            
            return data;
        } catch (error) {
            Utils.hideLoading();
            console.error('API Error:', error);
            Utils.showToast('Network error. Please check your connection.', 'error');
            throw error;
        }
    }
};
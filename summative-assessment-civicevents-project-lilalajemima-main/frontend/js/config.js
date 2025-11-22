// CivicEvents+ Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:4000/api',
    UPLOADS_URL: 'http://localhost:4000/uploads',
    TOKEN_KEY: 'civicevents_token',
    USER_KEY: 'civicevents_user',
    SESSION_ONLY: false // Set to true for sessionStorage, false for localStorage
};

// Storage helper based on config
const Storage = {
    get: (key) => {
        const storage = CONFIG.SESSION_ONLY ? sessionStorage : localStorage;
        const item = storage.getItem(key);
        try { return JSON.parse(item); } catch { return item; }
    },
    set: (key, value) => {
        const storage = CONFIG.SESSION_ONLY ? sessionStorage : localStorage;
        storage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
    },
    remove: (key) => {
        const storage = CONFIG.SESSION_ONLY ? sessionStorage : localStorage;
        storage.removeItem(key);
    },
    clear: () => {
        const storage = CONFIG.SESSION_ONLY ? sessionStorage : localStorage;
        storage.removeItem(CONFIG.TOKEN_KEY);
        storage.removeItem(CONFIG.USER_KEY);
    }
};
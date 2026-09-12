// Kept separate from adminApi.js so the shop bundle never pulls in axios
const TOKEN_KEY = 'angel-admin-token';

export const getAdminToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
};

export const setAdminToken = (token) => {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch {
        // Storage blocked (private mode): the admin will simply be asked to log in again
    }
};

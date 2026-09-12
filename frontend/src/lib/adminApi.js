import axios from 'axios';
import { getAdminToken, setAdminToken } from './adminToken';

// All admin requests go through here: they carry the login token as a header
const adminApi = axios.create({ baseURL: `${import.meta.env.VITE_BACKEND_URL}/api` });

adminApi.interceptors.request.use((config) => {
    const token = getAdminToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Missing or expired session: go to the login page, then come back here
adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !window.location.pathname.startsWith('/admin/login')) {
            setAdminToken(null);
            window.location.assign(`/admin/login?next=${encodeURIComponent(window.location.pathname)}`);
        }
        return Promise.reject(error);
    }
);

// The backend's message, plus which fields were wrong when it lists them
export const apiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
    const data = error.response?.data;
    if (!data?.message) return fallback;
    const fields = data.details?.map((detail) => detail.field).filter(Boolean);
    return fields?.length ? `${data.message}: ${fields.join(', ')}` : data.message;
};

export default adminApi;

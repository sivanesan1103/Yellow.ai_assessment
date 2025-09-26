import axios from 'axios';

class AuthService {
    constructor() {
        this.baseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
        this.api = axios.create({
            baseURL: this.baseURL,
            withCredentials: true, // Enable cookies
        });

        // Request interceptor to add token if available
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor to handle token refresh
        this.api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        // Try to refresh token using cookie-based refresh
                        const response = await axios.post(
                            `${this.baseURL}/api/auth/refresh`,
                            {},
                            { withCredentials: true }
                        );

                        if (response.data.success) {
                            const newToken = response.data.token;
                            localStorage.setItem('token', newToken);
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return axios(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        this.logout();
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // Register with email/password
    async register(name, email, password) {
        try {
            const response = await this.api.post('/api/auth/register', {
                name,
                email,
                password,
            });

            if (response.data.success) {
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                return {
                    success: true,
                    user: response.data.user,
                    token: response.data.token,
                };
            }

            return {
                success: false,
                message: response.data.message,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed',
            };
        }
    }

    // Login with email/password
    async login(email, password) {
        try {
            const response = await this.api.post('/api/auth/login', {
                email,
                password,
            });

            if (response.data.success) {
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                return {
                    success: true,
                    user: response.data.user,
                    token: response.data.token,
                };
            }

            return {
                success: false,
                message: response.data.message,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
            };
        }
    }

    // Initiate Google OAuth
    loginWithGoogle() {
        window.location.href = `${this.baseURL}/api/auth/google`;
    }

    // Handle OAuth callback (call this on OAuth success redirect)
    handleOAuthCallback(token) {
        if (token) {
            localStorage.setItem('token', token);
            return true;
        }
        return false;
    }

    // Get current user
    async getCurrentUser() {
        try {
            const response = await this.api.get('/api/auth/me');
            
            if (response.data.success) {
                return {
                    success: true,
                    user: response.data.user,
                };
            }

            return {
                success: false,
                message: response.data.message,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to get user',
            };
        }
    }

    // Refresh access token
    async refreshToken() {
        try {
            const response = await axios.post(
                `${this.baseURL}/api/auth/refresh`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                const newToken = response.data.token;
                localStorage.setItem('token', newToken);
                return {
                    success: true,
                    token: newToken,
                    user: response.data.user,
                };
            }

            return {
                success: false,
                message: response.data.message,
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Token refresh failed',
            };
        }
    }

    // Logout
    async logout() {
        try {
            await this.api.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Clear local storage regardless of API call success
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to login or home page
            window.location.href = '/';
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            // Basic JWT validation (check expiration)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp > currentTime;
        } catch (error) {
            return false;
        }
    }

    // Get stored token
    getToken() {
        return localStorage.getItem('token');
    }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
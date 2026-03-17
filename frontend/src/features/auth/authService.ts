import {
    LoginRequest,
    RegisterRequest,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
    ApiResponse
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

class AuthService {
    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        const contentType = response.headers.get('content-type');

        if (!response.ok) {
            if (contentType?.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Request failed');
            }
            const message = await response.text();
            throw new Error(message || 'Request failed');
        }

        if (contentType?.includes('application/json')) {
            const data = await response.json();
            return {
                success: true,
                data: data as T,
                message: data.message || 'Success'
            };
        }

        const text = await response.text();
        return { success: true, message: text };
    }

    setTokens(accessToken: string, refreshToken?: string) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    }

    getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('access_token');
    }

    clearTokens() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    setUser(user: { fullName: string } | null) {
        if (typeof window === 'undefined') return;
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }

    getCurrentUser(): { fullName: string } | null {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    async login(identifier: string, password: string): Promise<ApiResponse<{ accessToken: string; refreshToken: string; fullName: string }>> {
        const isEmail = identifier.includes('@');
        const payload: LoginRequest = isEmail
            ? { email: identifier, password }
            : { phoneNumber: identifier, password };

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await this.handleResponse<{ accessToken: string; refreshToken: string; fullName: string }>(response);

        if (result.data) {
            this.setTokens(result.data.accessToken, result.data.refreshToken);
            this.setUser({ fullName: result.data.fullName });
        }

        return result;
    }

    async logout(shouldRedirect = true): Promise<void> {
        const token = this.getAccessToken();

        try {
            if (token) {
                await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch {
        } finally {
            this.clearTokens();
            this.setUser(null);
            if (shouldRedirect && typeof window !== 'undefined') {
                window.location.href = '/';
            }
        }
    }

    async register(data: RegisterRequest): Promise<ApiResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    async forgotPassword(email: string): Promise<ApiResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/forgot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email } as ForgotPasswordRequest)
        });
        return this.handleResponse(response);
    }

    async verifyOTP(email: string, otp: string): Promise<ApiResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp } as VerifyOTPRequest)
        });
        return this.handleResponse(response);
    }

    async resetPassword(
        email: string,
        otp: string,
        newPassword: string,
        confirmPassword: string
    ): Promise<ApiResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword, confirmPassword } as ResetPasswordRequest)
        });
        return this.handleResponse(response);
    }

    async resendOTP(email: string): Promise<ApiResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return this.handleResponse(response);
    }
}

export const authService = new AuthService();
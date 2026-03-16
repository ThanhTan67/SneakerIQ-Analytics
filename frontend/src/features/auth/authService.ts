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
            } else {
                const message = await response.text();
                throw new Error(message || 'Request failed');
            }
        }

        if (contentType?.includes('application/json')) {
            const data = await response.json();
            return {
                success: true,
                data: data as T,
                message: data.message
            };
        } else {
            const text = await response.text();
            return {
                success: true,
                message: text
            };
        }
    }

    async login(identifier: string, password: string): Promise<ApiResponse> {
        try {
            const isEmail = identifier.includes('@');
            const payload: LoginRequest = {
                ...(isEmail ? { email: identifier } : { phoneNumber: identifier }),
                password
            };

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            return this.handleResponse(response);
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Login failed');
        }
    }

    async register(data: RegisterRequest): Promise<ApiResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            return this.handleResponse(response);
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Registration failed');
        }
    }

    async forgotPassword(email: string): Promise<ApiResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email } as ForgotPasswordRequest),
                credentials: 'include'
            });

            return this.handleResponse(response);
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Failed to send verification code');
        }
    }

    async verifyOTP(email: string, otp: string): Promise<ApiResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp } as VerifyOTPRequest),
                credentials: 'include'
            });

            return this.handleResponse(response);
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Invalid verification code');
        }
    }

    async resetPassword(
        email: string,
        otp: string,
        newPassword: string,
        confirmPassword: string
    ): Promise<ApiResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    otp,
                    newPassword,
                    confirmPassword
                } as ResetPasswordRequest),
                credentials: 'include'
            });

            return this.handleResponse(response);
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
        }
    }

    async resendOTP(email: string): Promise<ApiResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
                credentials: 'include'
            });

            return this.handleResponse(response);
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Failed to resend verification code');
        }
    }
}

export const authService = new AuthService();
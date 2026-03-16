// Request/Response types
export interface LoginRequest {
    email?: string;
    phoneNumber?: string;
    password: string;
}

export interface RegisterRequest {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    gender: string;
    dateOfBirth: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface VerifyOTPRequest {
    email: string;
    otp: string;
}

export interface ResetPasswordRequest {
    email: string;
    newPassword: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

// Form types
export interface LoginFormData {
    identifier: string;
    password: string;
    rememberMe: boolean;
}

export interface RegisterFormData {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    gender: string;
    dateOfBirth: string;
    terms: boolean;
}

export interface ForgotPasswordFormData {
    email: string;
    otp: string[];
    newPassword: string;
    confirmPassword: string;
}

export interface FormErrors {
    [key: string]: string | undefined;
}

// Step types for forgot password
export type ForgotPasswordStep = 'EMAIL' | 'OTP' | 'RESET';

// Password strength
export interface PasswordStrength {
    strength: number;
    text: string;
    color: string;
}

export interface PasswordRequirement {
    id: string;
    label: string;
    validator: (password: string) => boolean;
}
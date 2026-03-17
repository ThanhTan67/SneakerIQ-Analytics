import { useState, useCallback, useEffect } from 'react';
import { authService } from './authService';
import {
    RegisterFormData,
    ForgotPasswordFormData,
    FormErrors
} from './types';
import {
    REGISTER_VALIDATION_RULES,
    FORGOT_PASSWORD_RULES
} from './validations';

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [user, setUser] = useState<{ fullName: string } | null>(null);

    // Load user từ localStorage khi component mount
    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
    }, []);

    // Lắng nghe sự thay đổi từ tab khác
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user') {
                const currentUser = authService.getCurrentUser();
                setUser(currentUser);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Login
    const login = useCallback(async (identifier: string, password: string) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await authService.login(identifier, password);

            if (response.data?.fullName) {
                // Set user state ngay lập tức
                setUser({ fullName: response.data.fullName });
            }

            setSuccess(response.message || 'Login successful');
            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Logout
    const logout = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            await authService.logout();
            setUser(null);
            setSuccess('Logout successful');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Logout failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Register validation
    const validateRegisterField = useCallback((
        name: string,
        value: any,
        formData?: RegisterFormData
    ): string => {
        const rules = REGISTER_VALIDATION_RULES[name];
        if (!rules) return '';

        if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
            return rules.required;
        }

        if (rules.minLength && value && value.length < rules.minLength.value) {
            return rules.minLength.message;
        }

        if (rules.maxLength && value && value.length > rules.maxLength.value) {
            return rules.maxLength.message;
        }

        if (rules.pattern && value && !rules.pattern.value.test(value)) {
            return rules.pattern.message;
        }

        if (rules.validate) {
            const result = rules.validate(value, formData);
            if (typeof result === 'string') return result;
        }

        return '';
    }, []);

    const validateRegisterForm = useCallback((
        formData: RegisterFormData
    ): FormErrors => {
        const errors: FormErrors = {};

        Object.keys(REGISTER_VALIDATION_RULES).forEach(key => {
            const error = validateRegisterField(
                key,
                formData[key as keyof RegisterFormData],
                formData
            );
            if (error) {
                errors[key] = error;
            }
        });

        return errors;
    }, [validateRegisterField]);

    const register = useCallback(async (data: Omit<RegisterFormData, 'confirmPassword' | 'terms'>) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await authService.register(data);
            setSuccess(response.message || 'Registration successful');
            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Forgot Password validation
    const validateForgotPasswordField = useCallback((
        field: keyof ForgotPasswordFormData,
        value: any,
        formData?: ForgotPasswordFormData
    ): string => {
        switch (field) {
            case 'email':
                return FORGOT_PASSWORD_RULES.email(value);
            case 'otp':
                return FORGOT_PASSWORD_RULES.otp(value);
            case 'newPassword':
                return FORGOT_PASSWORD_RULES.password(value);
            case 'confirmPassword':
                return FORGOT_PASSWORD_RULES.confirmPassword(value, formData?.newPassword || '');
            default:
                return '';
        }
    }, []);

    const validateForgotPasswordForm = useCallback((
        formData: ForgotPasswordFormData,
        step: 'EMAIL' | 'OTP' | 'RESET'
    ): FormErrors => {
        const errors: FormErrors = {};

        if (step === 'EMAIL') {
            const emailError = FORGOT_PASSWORD_RULES.email(formData.email);
            if (emailError) errors.email = emailError;
        }

        if (step === 'OTP') {
            const otpError = FORGOT_PASSWORD_RULES.otp(formData.otp);
            if (otpError) errors.otp = otpError;
        }

        if (step === 'RESET') {
            const passwordError = FORGOT_PASSWORD_RULES.password(formData.newPassword);
            if (passwordError) errors.newPassword = passwordError;

            const confirmError = FORGOT_PASSWORD_RULES.confirmPassword(
                formData.confirmPassword,
                formData.newPassword
            );
            if (confirmError) errors.confirmPassword = confirmError;
        }

        return errors;
    }, []);

    const forgotPassword = useCallback(async (email: string) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await authService.forgotPassword(email);
            setSuccess(response.message || 'Verification code sent');
            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send verification code';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const verifyOTP = useCallback(async (email: string, otp: string) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await authService.verifyOTP(email, otp);
            setSuccess(response.message || 'Email verified successfully');
            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Invalid verification code';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetPassword = useCallback(async (
        email: string,
        otp: string,
        newPassword: string,
        confirmPassword: string
    ) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await authService.resetPassword(email, otp, newPassword, confirmPassword);
            setSuccess(response.message || 'Password reset successful');
            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to reset password';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resendOTP = useCallback(async (email: string) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await authService.resendOTP(email);
            setSuccess(response.message || 'Verification code resent');
            return response;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to resend code';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearMessages = useCallback(() => {
        setError('');
        setSuccess('');
    }, []);

    return {
        // States
        isLoading,
        error,
        success,
        user,
        isAuthenticated: !!user,

        // Login/Logout
        login,
        logout,

        // Register
        validateRegisterField,
        validateRegisterForm,
        register,

        // Forgot Password
        validateForgotPasswordField,
        validateForgotPasswordForm,
        forgotPassword,
        verifyOTP,
        resetPassword,
        resendOTP,

        // Utilities
        clearMessages,
        setError,
        setSuccess
    };
};
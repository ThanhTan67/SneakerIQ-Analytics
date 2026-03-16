'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { ForgotPasswordStep, ForgotPasswordFormData, FormErrors } from '@/features/auth/types';
import EmailStep from '@/components/auth/email-step';
import OTPStep from '@/components/auth/otp-step';
import ResetPasswordStep from '@/components/auth/reset-password-step';
import '@/styles/assets/auth.css';

const INITIAL_FORM_DATA: ForgotPasswordFormData = {
    email: '',
    otp: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: ''
};

export default function ForgotPassword() {
    const router = useRouter();
    const {
        isLoading,
        error,
        success,
        validateForgotPasswordField,
        validateForgotPasswordForm,
        forgotPassword,
        verifyOTP,
        resetPassword,
        resendOTP,
        clearMessages
    } = useAuth();

    // State
    const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>('EMAIL');
    const [formData, setFormData] = useState<ForgotPasswordFormData>(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (currentStep === 'OTP' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [currentStep, timer]);

    // Clear messages on step change
    useEffect(() => {
        clearMessages();
    }, [currentStep, clearMessages]);

    // Handlers
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ email: true });

        const emailError = validateForgotPasswordField('email', formData.email);
        if (emailError) {
            setErrors({ email: emailError });
            return;
        }

        try {
            await forgotPassword(formData.email);
            setCurrentStep('OTP');
            setTimer(60);
            setCanResend(false);
        } catch {
            // Error handled by useAuth
        }
    };

    const handleOTPSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const otpError = validateForgotPasswordField('otp', formData.otp);
        if (otpError) {
            setErrors({ otp: otpError });
            return;
        }

        try {
            await verifyOTP(formData.email, formData.otp.join(''));
            setCurrentStep('RESET');
        } catch {
            // Error handled by useAuth
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setTouched({ newPassword: true, confirmPassword: true });
        const formErrors = validateForgotPasswordForm(formData, 'RESET');

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        try {
            await resetPassword(
                formData.email,
                formData.otp.join(''),
                formData.newPassword,
                formData.confirmPassword
            );
            setTimeout(() => router.push('/login'), 3000);
        } catch {
            // Error handled by useAuth
        }
    };

    const handleResendOTP = async () => {
        if (!canResend || isLoading) return;

        try {
            await resendOTP(formData.email);
            setTimer(60);
            setCanResend(false);
            setFormData(prev => ({ ...prev, otp: ['', '', '', '', '', ''] }));
        } catch {
            // Error handled by useAuth
        }
    };


    const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
            const prevInput = document.querySelectorAll('.otp-input')[index - 1] as HTMLInputElement;
            prevInput?.focus();
        }
    };

    // OTP handlers - sửa lại như này
    const handleOTPChange = (index: number, value: string) => {
        // Kiểm tra chỉ cho nhập số
        if (value && !/^\d+$/.test(value)) return;

        const newOTP = [...formData.otp];
        newOTP[index] = value;
        setFormData({ ...formData, otp: newOTP });

        // Xóa lỗi nếu có
        if (errors.otp) {
            setErrors({ ...errors, otp: undefined });
        }
    };

    const handleOTPPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const numbersOnly = pastedData.replace(/\D/g, '');
        const pastedOTP = numbersOnly.slice(0, 6).split('');

        if (pastedOTP.length === 6 && pastedOTP.every(char => /^\d$/.test(char))) {
            setFormData({ ...formData, otp: pastedOTP });
        }
    };

    // Input handlers
    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        if (field === 'email') {
            const error = validateForgotPasswordField('email', formData.email);
            setErrors(prev => ({ ...prev, email: error }));
        }
    };

    // Steps indicator
    const renderSteps = () => (
        <div className="steps-indicator">
            {[
                { step: 'EMAIL', label: 'Email' },
                { step: 'OTP', label: 'Verify' },
                { step: 'RESET', label: 'Reset' }
            ].map((item, index) => {
                const isActive = currentStep === item.step;
                const isCompleted = (item.step === 'EMAIL' && currentStep !== 'EMAIL') ||
                    (item.step === 'OTP' && currentStep === 'RESET');

                return (
                    <div key={item.step} className="step-wrapper">
                        <div className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                            <div className="step-circle">{index + 1}</div>
                            <span className="step-label">{item.label}</span>
                        </div>
                        {index < 2 && <div className="step-line" />}
                    </div>
                );
            })}
        </div>
    );

    return (
        <main className="forgot-container">
            {renderSteps()}

            {currentStep === 'EMAIL' && (
                <EmailStep
                    email={formData.email}
                    onEmailChange={(value) => handleInputChange('email', value)}
                    onBlur={() => handleBlur('email')}
                    error={errors.email}
                    touched={touched.email}
                    isLoading={isLoading}
                    onSubmit={handleEmailSubmit}
                />
            )}

            {currentStep === 'OTP' && (
                <OTPStep
                    email={formData.email}
                    otp={formData.otp}
                    onOTPChange={handleOTPChange}
                    onOTPKeyDown={handleOTPKeyDown}
                    onOTPPaste={handleOTPPaste}
                    error={errors.otp}
                    timer={timer}
                    canResend={canResend}
                    isLoading={isLoading}
                    onResend={handleResendOTP}
                    onSubmit={handleOTPSubmit}
                />
            )}

            {currentStep === 'RESET' && (
                <ResetPasswordStep
                    newPassword={formData.newPassword}
                    confirmPassword={formData.confirmPassword}
                    onNewPasswordChange={(value) => handleInputChange('newPassword', value)}
                    onConfirmPasswordChange={(value) => handleInputChange('confirmPassword', value)}
                    onNewPasswordBlur={() => handleBlur('newPassword')}
                    onConfirmPasswordBlur={() => handleBlur('confirmPassword')}
                    errors={errors}
                    touched={touched}
                    isLoading={isLoading}
                    onSubmit={handleResetSubmit}
                />
            )}

            {/* Messages */}
            {error && (
                <div className="message-error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {success && (
                <div className="message-success">
                    {success}
                    {currentStep === 'RESET' && success.includes('successful') && (
                        <div className="redirect-message">Redirecting to login...</div>
                    )}
                </div>
            )}

            {/* Back to login link */}
            <div className="back-to-login">
                <Link href="/login" className="back-link">
                    <svg className="back-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Login
                </Link>
            </div>
        </main>
    );
}
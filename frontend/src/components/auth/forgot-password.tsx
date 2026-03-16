'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import {
    ForgotPasswordStep,
    ForgotPasswordFormData,
    FormErrors
} from '@/features/auth/types';
import { PASSWORD_REQUIREMENTS, getPasswordStrength } from '@/features/auth/validations';
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

    // Refs
    const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

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

    // Handle email submission
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

            // Focus first OTP input after step change
            setTimeout(() => {
                otpInputs.current[0]?.focus();
            }, 100);
        } catch {
            // Error handled by useAuth
        }
    };

    // Handle OTP submission
    const handleOTPSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const otpError = validateForgotPasswordField('otp', formData.otp);

        if (otpError) {
            setErrors({ otp: otpError });
            return;
        }

        try {
            const otpString = formData.otp.join('');
            await verifyOTP(formData.email, otpString);
            setCurrentStep('RESET');
        } catch {
            // Error handled by useAuth
        }
    };

    // Handle password reset submission
    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setTouched({ newPassword: true, confirmPassword: true });

        const formErrors = validateForgotPasswordForm(formData, 'RESET');

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        try {
            // ✅ Lấy OTP từ mảng (6 số)
            const otpString = formData.otp.join('');

            // ✅ Log để kiểm tra dữ liệu
            console.log('Sending reset password:', {
                email: formData.email,
                otp: otpString,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });

            await resetPassword(
                formData.email,
                otpString,
                formData.newPassword,
                formData.confirmPassword
            );

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (error) {
            console.error('Reset password error:', error);
            // Error handled by useAuth
        }
    };

    // Handle resend OTP
    const handleResendOTP = async () => {
        if (!canResend || isLoading) return;

        try {
            await resendOTP(formData.email);
            setTimer(60);
            setCanResend(false);

            // Clear OTP fields
            setFormData(prev => ({ ...prev, otp: ['', '', '', '', '', ''] }));
            otpInputs.current[0]?.focus();
        } catch {
            // Error handled by useAuth
        }
    };

    // OTP handlers
    const handleOTPChange = (index: number, value: string) => {
        if (value.length > 1) return;

        if (value && !/^\d$/.test(value)) return;

        const newOTP = [...formData.otp];
        newOTP[index] = value;
        setFormData({ ...formData, otp: newOTP });

        // Auto-focus next input
        if (value && index < 5) {
            otpInputs.current[index + 1]?.focus();
        }

        // Clear OTP error
        if (errors.otp) {
            setErrors({ ...errors, otp: undefined });
        }
    };

    const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    const handleOTPPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const numbersOnly = pastedData.replace(/\D/g, '');
        const pastedOTP = numbersOnly.slice(0, 6).split('');

        if (pastedOTP.length === 6 && pastedOTP.every(char => /^\d$/.test(char))) {
            const newOTP = [...formData.otp];
            pastedOTP.forEach((digit, index) => {
                newOTP[index] = digit;
            });
            setFormData({ ...formData, otp: newOTP });
            otpInputs.current[5]?.focus();
        }
    };

    // Input handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));

        if (field === 'email') {
            const error = validateForgotPasswordField('email', formData.email);
            setErrors(prev => ({ ...prev, email: error }));
        }
    };

    // Render steps indicator
    const renderSteps = () => (
        <div className="steps-indicator">
            {[
                { step: 'EMAIL', label: 'Email' },
                { step: 'OTP', label: 'Verify' },
                { step: 'RESET', label: 'Reset' }
            ].map((item, index) => {
                const isActive = currentStep === item.step;
                const isCompleted =
                    (item.step === 'EMAIL' && currentStep !== 'EMAIL') ||
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

    // Render email step
    const renderEmailStep = () => (
        <div className="step-content">
            <h1 className="forgot-title">Forgot Password?</h1>
            <p className="forgot-subtitle">
                Enter your email address and we'll send you a verification code to reset your password.
            </p>

            <form onSubmit={handleEmailSubmit} className="forgot-form">
                <div className="form-group">
                    <label htmlFor="email">
                        Email address <span className="required-star">*</span>
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('email')}
                        placeholder="e.g., john@example.com"
                        className={touched.email && errors.email ? 'error-input' : ''}
                        disabled={isLoading}
                    />
                    {touched.email && errors.email && (
                        <div className="field-error">{errors.email}</div>
                    )}
                </div>

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={isLoading}
                >
                    {isLoading ? 'Sending...' : 'Send verification code'}
                </button>
            </form>
        </div>
    );

    // Render OTP step
    const renderOTPStep = () => (
        <div className="step-content">
            <h1 className="forgot-title">Verify Your Email</h1>
            <p className="forgot-subtitle">
                We've sent a 6-digit verification code to<br />
                <strong>{formData.email}</strong>
            </p>

            <div className="info-box">
                <svg className="info-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="info-text">
                    Please enter the verification code sent to your email.
                </div>
            </div>

            <form onSubmit={handleOTPSubmit} className="forgot-form">
                <div className="form-group">
                    <label>Verification code <span className="required-star">*</span></label>
                    <div className="otp-group">
                        {formData.otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { otpInputs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOTPChange(index, e.target.value)}
                                onKeyDown={(e) => handleOTPKeyDown(index, e)}
                                onPaste={index === 0 ? handleOTPPaste : undefined}
                                className={`otp-input ${errors.otp ? 'error-input' : ''}`}
                                disabled={isLoading}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>
                    {errors.otp && (
                        <div className="field-error">{errors.otp}</div>
                    )}
                </div>

                <div className="timer-text">
                    {canResend ? (
                        <button
                            type="button"
                            className="resend-link"
                            onClick={handleResendOTP}
                            disabled={isLoading}
                        >
                            Resend verification code
                        </button>
                    ) : (
                        <>Resend code in <span className="timer-highlight">{timer}s</span></>
                    )}
                </div>

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={isLoading}
                >
                    {isLoading ? 'Verifying...' : 'Verify code'}
                </button>
            </form>
        </div>
    );

    // Render reset password step
    const renderResetStep = () => {
        const passwordStrength = getPasswordStrength(formData.newPassword);

        return (
            <div className="step-content">
                <h1 className="forgot-title">Reset Password</h1>
                <p className="forgot-subtitle">
                    Create a new password for your account
                </p>

                <form onSubmit={handleResetSubmit} className="forgot-form">
                    <div className="form-group">
                        <label htmlFor="newPassword">
                            New password <span className="required-star">*</span>
                        </label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            onBlur={() => {
                                setTouched(prev => ({ ...prev, newPassword: true }));
                                const error = validateForgotPasswordField('newPassword', formData.newPassword);
                                setErrors(prev => ({ ...prev, newPassword: error }));
                            }}
                            placeholder="Enter new password"
                            className={touched.newPassword && errors.newPassword ? 'error-input' : ''}
                            disabled={isLoading}
                        />

                        {formData.newPassword && (
                            <div className="password-strength">
                                <div className="password-strength-bar">
                                    <div
                                        className="password-strength-fill"
                                        style={{
                                            width: `${(passwordStrength.strength / 5) * 100}%`,
                                            backgroundColor: passwordStrength.color
                                        }}
                                    />
                                </div>
                                <div
                                    className="password-strength-text"
                                    style={{ color: passwordStrength.color }}
                                >
                                    {passwordStrength.text}
                                </div>
                            </div>
                        )}

                        <div className="password-requirements">
                            <div className="requirements-title">Password must contain:</div>
                            <ul className="requirements-list">
                                {PASSWORD_REQUIREMENTS.map(req => (
                                    <li
                                        key={req.id}
                                        className={`requirement-item ${req.validator(formData.newPassword) ? 'met' : ''}`}
                                    >
                                        <span className="requirement-icon">
                                            {req.validator(formData.newPassword) ? '✓' : '○'}
                                        </span>
                                        {req.label}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {touched.newPassword && errors.newPassword && (
                            <div className="field-error">{errors.newPassword}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Confirm new password <span className="required-star">*</span>
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            onBlur={() => {
                                setTouched(prev => ({ ...prev, confirmPassword: true }));
                                const error = validateForgotPasswordField('confirmPassword', formData.confirmPassword, formData);
                                setErrors(prev => ({ ...prev, confirmPassword: error }));
                            }}
                            placeholder="Confirm new password"
                            className={touched.confirmPassword && errors.confirmPassword ? 'error-input' : ''}
                            disabled={isLoading}
                        />
                        {touched.confirmPassword && errors.confirmPassword && (
                            <div className="field-error">{errors.confirmPassword}</div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Resetting...' : 'Reset password'}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <main className="forgot-container">
            {renderSteps()}

            {currentStep === 'EMAIL' && renderEmailStep()}
            {currentStep === 'OTP' && renderOTPStep()}
            {currentStep === 'RESET' && renderResetStep()}

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
                        <div className="redirect-message">
                            Redirecting to login...
                        </div>
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
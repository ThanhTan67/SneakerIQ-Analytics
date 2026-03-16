'use client';

import { useRef, useEffect } from 'react';

interface OTPStepProps {
    email: string;
    otp: string[];
    onOTPChange: (index: number, value: string) => void;
    onOTPKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
    onOTPPaste: (e: React.ClipboardEvent) => void;
    error?: string;
    timer: number;
    canResend: boolean;
    isLoading: boolean;
    onResend: () => void;
    onSubmit: (e: React.FormEvent) => void;
}

export default function OTPStep({
                                    email,
                                    otp,
                                    onOTPChange,
                                    onOTPKeyDown,
                                    onOTPPaste,
                                    error,
                                    timer,
                                    canResend,
                                    isLoading,
                                    onResend,
                                    onSubmit
                                }: OTPStepProps) {
    const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus ô đầu tiên khi component mount
    useEffect(() => {
        otpInputs.current[0]?.focus();
    }, []);

    // Auto-focus khi nhập
    const handleChange = (index: number, value: string) => {
        onOTPChange(index, value);

        // Auto focus next input
        if (value && index < 5) {
            otpInputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        onOTPKeyDown(index, e);

        // Focus previous on backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        onOTPPaste(e);
    };

    return (
        <div className="step-content">
            <h1 className="forgot-title">Verify Your Email</h1>
            <p className="forgot-subtitle">
                We've sent a 6-digit verification code to<br />
                <strong>{email}</strong>
            </p>

            <div className="info-box">
                <svg className="info-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="info-text">
                    Please enter the verification code sent to your email.
                </div>
            </div>

            <form onSubmit={onSubmit} className="forgot-form">
                <div className="form-group">
                    <label>Verification code <span className="required-star">*</span></label>
                    <div className="otp-group">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { otpInputs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className={`otp-input ${error ? 'error-input' : ''}`}
                                disabled={isLoading}
                            />
                        ))}
                    </div>
                    {error && (
                        <div className="field-error">{error}</div>
                    )}
                </div>

                <div className="timer-text">
                    {canResend ? (
                        <button
                            type="button"
                            className="resend-link"
                            onClick={onResend}
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
}
'use client';

import { PASSWORD_REQUIREMENTS, getPasswordStrength } from '@/features/auth/validations';

interface ResetPasswordStepProps {
    newPassword: string;
    confirmPassword: string;
    onNewPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
    onNewPasswordBlur: () => void;
    onConfirmPasswordBlur: () => void;
    errors: {
        newPassword?: string;
        confirmPassword?: string;
    };
    touched: {
        newPassword?: boolean;
        confirmPassword?: boolean;
    };
    isLoading: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export default function ResetPasswordStep({
    newPassword,
    confirmPassword,
    onNewPasswordChange,
    onConfirmPasswordChange,
    onNewPasswordBlur,
    onConfirmPasswordBlur,
    errors,
    touched,
    isLoading,
    onSubmit
}: ResetPasswordStepProps) {
    const passwordStrength = getPasswordStrength(newPassword);

    return (
        <div className="step-content">
            <h1 className="forgot-title">Reset Password</h1>
            <p className="forgot-subtitle">
                Create a new password for your account
            </p>

            <form onSubmit={onSubmit} className="forgot-form">
                <div className="form-group">
                    <label htmlFor="newPassword">
                        New password <span className="required-star">*</span>
                    </label>
                    <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => onNewPasswordChange(e.target.value)}
                        onBlur={onNewPasswordBlur}
                        placeholder="Enter new password"
                        className={touched.newPassword && errors.newPassword ? 'error-input' : ''}
                        disabled={isLoading}
                    />

                    {newPassword && (
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
                                    className={`requirement-item ${req.validator(newPassword) ? 'met' : ''}`}
                                >
                                    <span className="requirement-icon">
                                        {req.validator(newPassword) ? '✓' : '○'}
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
                        value={confirmPassword}
                        onChange={(e) => onConfirmPasswordChange(e.target.value)}
                        onBlur={onConfirmPasswordBlur}
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
}
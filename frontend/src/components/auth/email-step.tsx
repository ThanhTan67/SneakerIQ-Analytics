'use client';

interface EmailStepProps {
    email: string;
    onEmailChange: (value: string) => void;
    onBlur: () => void;
    error?: string;
    touched?: boolean;
    isLoading: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export default function EmailStep({
                                      email,
                                      onEmailChange,
                                      onBlur,
                                      error,
                                      touched,
                                      isLoading,
                                      onSubmit
                                  }: EmailStepProps) {
    return (
        <div className="step-content">
            <h1 className="forgot-title">Forgot Password?</h1>
            <p className="forgot-subtitle">
                Enter your email address and we'll send you a verification code to reset your password.
            </p>

            <form onSubmit={onSubmit} className="forgot-form">
                <div className="form-group">
                    <label htmlFor="email">
                        Email address <span className="required-star">*</span>
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => onEmailChange(e.target.value)}
                        onBlur={onBlur}
                        placeholder="e.g., john@example.com"
                        className={touched && error ? 'error-input' : ''}
                        disabled={isLoading}
                    />
                    {touched && error && (
                        <div className="field-error">{error}</div>
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
}
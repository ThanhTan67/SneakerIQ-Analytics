'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { RegisterFormData, FormErrors } from '@/features/auth/types';
import { getPasswordStrength } from '@/features/auth/validations';
import '@/styles/assets/auth.css';

const INITIAL_FORM_DATA: RegisterFormData = {
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dateOfBirth: '',
    terms: false
};

export default function RegisterPage() {
    const router = useRouter();
    const {
        isLoading,
        error,
        success,
        validateRegisterField,
        validateRegisterForm,
        register,
        clearMessages
    } = useAuth();

    const [formData, setFormData] = useState<RegisterFormData>(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    // Real-time validation for password match
    useEffect(() => {
        if (touched.confirmPassword || formData.confirmPassword) {
            const error = validateRegisterField('confirmPassword', formData.confirmPassword, formData);
            setErrors(prev => ({ ...prev, confirmPassword: error }));
        }
    }, [formData.password, formData.confirmPassword, touched.confirmPassword, validateRegisterField, formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => ({ ...prev, [name]: newValue }));

        // Clear field error
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name } = e.target;

        setTouched(prev => ({ ...prev, [name]: true }));

        const error = validateRegisterField(
            name,
            formData[name as keyof RegisterFormData],
            formData
        );

        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearMessages();

        // Mark all fields as touched
        const allTouched = Object.keys(INITIAL_FORM_DATA).reduce((acc, key) => {
            acc[key] = true;
            return acc;
        }, {} as Record<string, boolean>);
        setTouched(allTouched);

        // Validate form
        const formErrors = validateRegisterForm(formData);
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);

            // Scroll to first error
            const firstError = document.querySelector('.field-error');
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        try {
            const { confirmPassword, terms, ...registerData } = formData;
            await register(registerData);

            // Reset form
            setFormData(INITIAL_FORM_DATA);
            setTouched({});
            setErrors({});

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login?registered=true');
            }, 3000);

        } catch {
            // Error handled by useAuth
        }
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <main className="register-container">
            <h1 className="register-title">Create your Glow Mart Store account</h1>
            <p className="register-subtitle">Join us for a better shopping experience.</p>

            <form className="register-form" onSubmit={handleSubmit} noValidate>
                {/* Full Name */}
                <div className="form-group">
                    <label htmlFor="fullName">
                        Full name <span className="required-star">*</span>
                    </label>
                    <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter your full name"
                        className={touched.fullName && errors.fullName ? 'error-input' : ''}
                        disabled={isLoading}
                    />
                    {touched.fullName && errors.fullName && (
                        <div className="field-error">{errors.fullName}</div>
                    )}
                </div>

                {/* Email */}
                <div className="form-group">
                    <label htmlFor="email">
                        Email <span className="required-star">*</span>
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g., john@example.com"
                        className={touched.email && errors.email ? 'error-input' : ''}
                        disabled={isLoading}
                    />
                    {touched.email && errors.email && (
                        <div className="field-error">{errors.email}</div>
                    )}
                </div>

                {/* Phone Number */}
                <div className="form-group">
                    <label htmlFor="phoneNumber">
                        Phone number <span className="required-star">*</span>
                    </label>
                    <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        required
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g., 0912345678"
                        maxLength={15}
                        className={touched.phoneNumber && errors.phoneNumber ? 'error-input' : ''}
                        disabled={isLoading}
                    />
                    {touched.phoneNumber && errors.phoneNumber && (
                        <div className="field-error">{errors.phoneNumber}</div>
                    )}
                </div>

                {/* Date of Birth and Gender - Row */}
                <div className="register-row">
                    <div className="form-group">
                        <label htmlFor="dateOfBirth">
                            Date of birth <span className="required-star">*</span>
                        </label>
                        <input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            required
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            max={new Date().toISOString().split('T')[0]}
                            className={touched.dateOfBirth && errors.dateOfBirth ? 'error-input' : ''}
                            disabled={isLoading}
                        />
                        {touched.dateOfBirth && errors.dateOfBirth && (
                            <div className="field-error">{errors.dateOfBirth}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="gender">
                            Gender <span className="required-star">*</span>
                        </label>
                        <select
                            id="gender"
                            name="gender"
                            required
                            value={formData.gender}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`register-select ${touched.gender && errors.gender ? 'error-input' : ''}`}
                            disabled={isLoading}
                        >
                            <option value="" disabled>Select gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </select>
                        {touched.gender && errors.gender && (
                            <div className="field-error">{errors.gender}</div>
                        )}
                    </div>
                </div>

                {/* Password */}
                <div className="form-group">
                    <label htmlFor="password">
                        Password <span className="required-star">*</span>
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="At least 8 characters"
                        className={touched.password && errors.password ? 'error-input' : ''}
                        disabled={isLoading}
                    />
                    {formData.password && (
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
                    {touched.password && errors.password && (
                        <div className="field-error">{errors.password}</div>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                    <label htmlFor="confirmPassword">
                        Confirm password <span className="required-star">*</span>
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Re-enter your password"
                        className={touched.confirmPassword && errors.confirmPassword ? 'error-input' : ''}
                        disabled={isLoading}
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                        <div className="field-error">{errors.confirmPassword}</div>
                    )}
                </div>

                {/* Terms and Conditions */}
                <div className="terms-group">
                    <input
                        type="checkbox"
                        id="terms"
                        name="terms"
                        checked={formData.terms}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isLoading}
                        className="terms-checkbox"
                    />
                    <label htmlFor="terms" className="terms-label">
                        I agree to the{' '}
                        <Link href="/terms" className="terms-links">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="terms-links">
                            Privacy Policy
                        </Link>
                        <span className="required-star">*</span>
                    </label>
                    {touched.terms && errors.terms && (
                        <div className="terms-error">
                            {errors.terms}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating account...' : 'Create account'}
                </button>
            </form>

            {/* Messages */}
            {error && (
                <div className="register-error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {success && (
                <div className="register-success">
                    {success}
                </div>
            )}

            <div className="auth-footer">
                <p>
                    Already have an account?{' '}
                    <Link href="/login" className="auth-link">
                        Sign in
                    </Link>
                </p>
            </div>

            {/* Social signup section */}
            <div className="social-login">
                <p className="social-text">Or sign up with</p>
                <div className="social-buttons">
                    <button
                        type="button"
                        className="google-btn"
                        onClick={() => alert('Google sign up coming soon!')}
                        disabled={isLoading}
                    >
                        <svg className="social-icon" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
                    <button
                        type="button"
                        className="facebook-btn"
                        onClick={() => alert('Facebook sign up coming soon!')}
                        disabled={isLoading}
                    >
                        <svg className="social-icon" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white" />
                        </svg>
                        Facebook
                    </button>
                </div>
            </div>
        </main>
    );
}
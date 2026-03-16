"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/useAuth";
import "@/styles/assets/auth.css";

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error, success, clearMessages } = useAuth();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearMessages();

        try {
            await login(identifier, password);

            // Lưu remember me preference
            if (rememberMe) {
                localStorage.setItem("rememberMe", "true");
            }

            // Redirect to store after successful login
            setTimeout(() => {
                router.push("/");
            }, 1500);

        } catch {
            // Error handled by useAuth
        }
    };

    const handleSocialLogin = (provider: string) => {
        alert(`Login with ${provider} is not integrated yet, UI demo only`);
    };

    return (
        <main className="login-container">
            <h1 className="login-title">Sign in to Glow Mart Store</h1>
            <p className="login-subtitle">Sign in for faster checkout.</p>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label htmlFor="identifier">
                        Email or phone number <span className="required-star">*</span>
                    </label>
                    <input
                        id="identifier"
                        name="identifier"
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g., john@example.com or 09xx..."
                        disabled={isLoading}
                        className={error ? "error-input" : ""}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">
                        Password <span className="required-star">*</span>
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={isLoading}
                        className={error ? "error-input" : ""}
                    />
                </div>

                <div className="form-options">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={isLoading}
                        />
                        <span>Remember me</span>
                    </label>

                    <Link href="/forgot-password" className="forgot-link">
                        Forgot password?
                    </Link>
                </div>

                {error && (
                    <div className="error-message">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={isLoading}
                >
                    {isLoading ? "Signing in..." : "Continue"}
                </button>
            </form>

            <div className="auth-footer">
                <p>
                    Don't have an account?{" "}
                    <Link href="/register" className="auth-link">
                        Sign up
                    </Link>
                </p>
            </div>

            {/* Social login section */}
            <div className="social-login">
                <p className="social-text">Or continue with</p>
                <div className="social-buttons">
                    <button
                        type="button"
                        className="google-btn"
                        onClick={() => handleSocialLogin("Google")}
                        disabled={isLoading}
                    >
                        <svg className="social-icon" viewBox="0 0 24 24" width="18" height="18">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </button>
                    <button
                        type="button"
                        className="facebook-btn"
                        onClick={() => handleSocialLogin("Facebook")}
                        disabled={isLoading}
                    >
                        <svg className="social-icon" viewBox="0 0 24 24" width="18" height="18">
                            <path
                                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                fill="white"
                            />
                        </svg>
                        Facebook
                    </button>
                </div>
            </div>
        </main>
    );
}
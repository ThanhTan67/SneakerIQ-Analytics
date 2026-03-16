import {PasswordRequirement, PasswordStrength} from "@/features/auth/types";

export interface ValidationRule {
    required?: string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    validate?: (value: any, formData?: any) => boolean | string;
}

// Validation rules for register
export const REGISTER_VALIDATION_RULES: Record<string, ValidationRule> = {
    fullName: {
        required: "Full name is required",
        minLength: { value: 3, message: "Full name must be at least 3 characters" },
        maxLength: { value: 50, message: "Full name must not exceed 50 characters" },
        pattern: {
            value: /^[\p{L}\s'-]+$/u,
            message: "Full name can only contain letters, spaces, hyphens and apostrophes"
        }
    },
    email: {
        required: "Email is required",
        pattern: {
            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            message: "Please enter a valid email address"
        }
    },
    phoneNumber: {
        required: "Phone number is required",
        pattern: {
            value: /^(0|[1-9][0-9]*)([0-9]{8,14})$/,
            message: "Please enter a valid phone number (9-15 digits)"
        },
        maxLength: { value: 15, message: "Phone number must not exceed 15 digits" }
    },
    password: {
        required: "Password is required",
        minLength: { value: 8, message: "Password must be at least 8 characters" },
        pattern: {
            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            message: "Password must contain at least one uppercase, one lowercase, one number and one special character"
        }
    },
    confirmPassword: {
        required: "Please confirm your password",
        validate: (value: string, formData: any) =>
            value === formData.password || "Passwords do not match"
    },
    gender: {
        required: "Please select your gender"
    },
    dateOfBirth: {
        required: "Date of birth is required",
        validate: (value: string) => {
            const date = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - date.getFullYear();
            const monthDiff = today.getMonth() - date.getMonth();

            if (age < 13 || (age === 13 && monthDiff < 0)) {
                return "You must be at least 13 years old to register";
            }
            if (age > 120) {
                return "Please enter a valid date of birth";
            }
            return true;
        }
    },
    terms: {
        required: "You must agree to the Terms of Service and Privacy Policy"
    }
};

// Validation rules for forgot password
export const FORGOT_PASSWORD_RULES = {
    email: (email: string): string => {
        if (!email) return "Email is required";
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return "Please enter a valid email address";
        return "";
    },

    otp: (otp: string[]): string => {
        if (otp.some(digit => !digit)) return "Please enter the complete verification code";
        return "";
    },

    password: (password: string): string => {
        if (!password) return "Password is required";
        if (password.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(password)) return "Password must contain at least one number";
        if (!/[@$!%*?&]/.test(password)) return "Password must contain at least one special character";
        return "";
    },

    confirmPassword: (confirm: string, password: string): string => {
        if (!confirm) return "Please confirm your password";
        if (confirm !== password) return "Passwords do not match";
        return "";
    }
};

// Password requirements for UI
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
    {
        id: 'minLength',
        label: 'At least 8 characters',
        validator: (pass: string) => pass.length >= 8
    },
    {
        id: 'hasUpperCase',
        label: 'One uppercase letter',
        validator: (pass: string) => /[A-Z]/.test(pass)
    },
    {
        id: 'hasLowerCase',
        label: 'One lowercase letter',
        validator: (pass: string) => /[a-z]/.test(pass)
    },
    {
        id: 'hasNumber',
        label: 'One number',
        validator: (pass: string) => /[0-9]/.test(pass)
    },
    {
        id: 'hasSpecialChar',
        label: 'One special character (@$!%*?&)',
        validator: (pass: string) => /[@$!%*?&]/.test(pass)
    }
];

// Password strength calculator
export const getPasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { strength: 0, text: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;

    const strengthMap: Record<number, { text: string; color: string }> = {
        0: { text: "Very weak", color: "#d70015" },
        1: { text: "Weak", color: "#d70015" },
        2: { text: "Fair", color: "#ff9f0a" },
        3: { text: "Good", color: "#28cd41" },
        4: { text: "Strong", color: "#28cd41" },
        5: { text: "Very strong", color: "#28cd41" }
    };

    return {
        strength,
        ...strengthMap[strength]
    };
};
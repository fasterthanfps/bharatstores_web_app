'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const RegisterSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z
        .string()
        .min(8, 'At least 8 characters')
        .regex(/[A-Z]/, 'At least one uppercase letter')
        .regex(/[0-9]/, 'At least one number'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({ resolver: zodResolver(RegisterSchema) });

    const onSubmit = async (data: RegisterForm) => {
        setServerError('');
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });

        if (error) {
            setServerError(error.message);
            return;
        }

        setSuccess(true);
    };

    if (success) {
        return (
            <div className="text-center py-6 space-y-5 animate-fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-500/10">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-masala-text font-display">Almost there!</h2>
                    <p className="text-sm text-masala-text-muted font-semibold leading-relaxed">
                        We sent you a confirmation email. Please check your inbox to activate your account.
                    </p>
                </div>
                <div className="pt-2">
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center h-11 px-6 rounded-2xl bg-masala-primary hover:bg-masala-secondary text-white font-black text-xs uppercase tracking-wider shadow-md shadow-masala-primary/10 transition-all duration-300"
                    >
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-black text-masala-text tracking-tight font-display">Create Account</h1>
                <p className="text-sm text-masala-text-muted mt-2 font-semibold">
                    Already have an account?{' '}
                    <Link href="/login" className="text-masala-primary hover:text-masala-accent font-black underline underline-offset-4 decoration-masala-primary/20 hover:decoration-masala-accent transition-colors">
                        Sign In
                    </Link>
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* Email input field */}
                <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-masala-text-muted" htmlFor="reg-email">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-masala-text-light" />
                        <input
                            id="reg-email"
                            type="email"
                            {...register('email')}
                            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-masala-muted/30 border border-masala-border/80 text-sm font-bold text-masala-text placeholder:text-masala-text-light focus:bg-white focus:outline-none focus:border-masala-primary focus:ring-4 focus:ring-masala-primary/5 transition-all duration-200"
                            placeholder="you@example.com"
                        />
                    </div>
                    {errors.email && (
                        <p className="text-[11px] font-bold text-masala-accent flex items-center gap-1 mt-1 animate-fade-in">
                            <AlertCircle className="h-3 w-3" />
                            <span>{errors.email.message}</span>
                        </p>
                    )}
                </div>

                {/* Password input field */}
                <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-masala-text-muted" htmlFor="reg-password">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-masala-text-light" />
                        <input
                            id="reg-password"
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            className="w-full h-11 pl-10 pr-10 rounded-2xl bg-masala-muted/30 border border-masala-border/80 text-sm font-bold text-masala-text placeholder:text-masala-text-light focus:bg-white focus:outline-none focus:border-masala-primary focus:ring-4 focus:ring-masala-primary/5 transition-all duration-200"
                            placeholder="At least 8 characters"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-masala-text-light hover:text-masala-primary transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-[11px] font-bold text-masala-accent flex items-center gap-1 mt-1 animate-fade-in">
                            <AlertCircle className="h-3 w-3" />
                            <span>{errors.password.message}</span>
                        </p>
                    )}
                </div>

                {/* Confirm Password input field */}
                <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-masala-text-muted" htmlFor="reg-confirm">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-masala-text-light" />
                        <input
                            id="reg-confirm"
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...register('confirmPassword')}
                            className="w-full h-11 pl-10 pr-10 rounded-2xl bg-masala-muted/30 border border-masala-border/80 text-sm font-bold text-masala-text placeholder:text-masala-text-light focus:bg-white focus:outline-none focus:border-masala-primary focus:ring-4 focus:ring-masala-primary/5 transition-all duration-200"
                            placeholder="Repeat password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-masala-text-light hover:text-masala-primary transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="text-[11px] font-bold text-masala-accent flex items-center gap-1 mt-1 animate-fade-in">
                            <AlertCircle className="h-3 w-3" />
                            <span>{errors.confirmPassword.message}</span>
                        </p>
                    )}
                </div>

                {serverError && (
                    <div className="rounded-2xl border border-masala-accent/20 bg-masala-accent/5 px-4 py-3 text-xs font-bold text-masala-accent flex items-start gap-2 animate-fade-in">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{serverError}</span>
                    </div>
                )}

                {/* Submit button */}
                <button
                    id="register-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-masala-primary to-masala-accent hover:opacity-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-masala-primary/10 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Creating Account...</span>
                        </>
                    ) : (
                        <span>Create Account</span>
                    )}
                </button>
            </form>
        </div>
    );
}

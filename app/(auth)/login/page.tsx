'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const LoginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'At least 6 characters'),
});

type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

    const onSubmit = async (data: LoginForm) => {
        setServerError('');
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            setServerError('Incorrect email or password. Please try again.');
            return;
        }

        router.refresh();
        router.push('/account');
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-masala-text tracking-tight font-display">Sign In</h1>
                <p className="text-sm text-masala-text-muted mt-2 font-semibold">
                    New here?{' '}
                    <Link href="/register" className="text-masala-primary hover:text-masala-accent font-black underline underline-offset-4 decoration-masala-primary/20 hover:decoration-masala-accent transition-colors">
                        Create an account
                    </Link>
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* Email input field */}
                <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-masala-text-muted" htmlFor="login-email">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-masala-text-light" />
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
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
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-black uppercase tracking-wider text-masala-text-muted" htmlFor="login-password">
                            Password
                        </label>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-masala-text-light" />
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            {...register('password')}
                            className="w-full h-11 pl-10 pr-10 rounded-2xl bg-masala-muted/30 border border-masala-border/80 text-sm font-bold text-masala-text placeholder:text-masala-text-light focus:bg-white focus:outline-none focus:border-masala-primary focus:ring-4 focus:ring-masala-primary/5 transition-all duration-200"
                            placeholder="••••••••"
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

                {serverError && (
                    <div className="rounded-2xl border border-masala-accent/20 bg-masala-accent/5 px-4 py-3 text-xs font-bold text-masala-accent flex items-start gap-2 animate-fade-in">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{serverError}</span>
                    </div>
                )}

                {/* Submit button */}
                <button
                    id="login-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-masala-primary to-masala-accent hover:opacity-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-masala-primary/10 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Signing In...</span>
                        </>
                    ) : (
                        <span>Sign In</span>
                    )}
                </button>
            </form>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldAlert, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const LoginSchema = z.object({
    email: z.string().transform(v => v.trim()).pipe(z.string().email('Please enter a valid email address')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof LoginSchema>;

export default function AdminLoginPage() {
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
        
        // 1. Authenticate with Supabase
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (authErr) {
            setServerError('Invalid email or password.');
            return;
        }

        const user = authData?.user;
        if (!user) {
            setServerError('An unexpected authentication error occurred.');
            return;
        }

        // 2. Perform role-based access check (is_admin)
        const { data: isAdmin, error: rpcErr } = await supabase.rpc('is_admin', { uid: user.id });

        if (rpcErr || !isAdmin) {
            // Sign out immediately to preserve security
            await supabase.auth.signOut();
            setServerError('Access Denied: You do not have administrative privileges.');
            return;
        }

        // 3. Clear and route to admin home
        router.refresh();
        router.push('/admin');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F0D0B] p-4 relative overflow-hidden">
            {/* Visual background aesthetics */}
            <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Inner box wrapper */}
            <div className="w-full max-w-[440px] z-10">
                {/* Brand / Logo Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-orange-400 font-semibold mb-4 animate-pulse">
                        <Sparkles className="h-3 w-3" /> Secure Gatekeeper
                    </div>
                    <h1 
                        className="text-3xl font-black tracking-tight text-white mb-2"
                        style={{ fontFamily: 'Fraunces, serif' }}
                    >
                        Control Panel
                    </h1>
                    <p className="text-sm text-gray-500">
                        Enter credentials to access BharatStores infrastructure.
                    </p>
                </div>

                {/* Glassmorphic Form Card */}
                <div className="rounded-2xl border border-white/8 bg-white/5 backdrop-blur-md p-8 shadow-2xl relative">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2" htmlFor="admin-email">
                                Security Username / Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    id="admin-email"
                                    type="email"
                                    autoComplete="email"
                                    {...register('email')}
                                    className="w-full rounded-xl border border-white/8 bg-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all"
                                    placeholder="admin@bharatstores.com"
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2" htmlFor="admin-password">
                                Security Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    {...register('password')}
                                    className="w-full rounded-xl border border-white/8 bg-white/5 pl-11 pr-11 py-3 text-sm text-white placeholder:text-gray-600 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Errors */}
                        {serverError && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400 flex items-start gap-2.5">
                                <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>{serverError}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            id="admin-login-submit"
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 py-3 text-sm font-semibold text-white disabled:opacity-75 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 active:scale-98"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Authorizing Session…</span>
                                </>
                            ) : (
                                <span>Authorize Access</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

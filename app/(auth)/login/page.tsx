'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const LoginSchema = z.object({
    email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
    password: z.string().min(6, 'Mindestens 6 Zeichen'),
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
            setServerError('E-Mail oder Passwort falsch. Bitte erneut versuchen.');
            return;
        }

        router.refresh();
        router.push('/account');
    };

    return (
        <>
            <h1 className="text-2xl font-bold text-white mb-2">Anmelden</h1>
            <p className="text-sm text-gray-400 mb-8">
                Noch kein Konto?{' '}
                <Link href="/register" className="text-orange-400 hover:text-orange-300">
                    Jetzt registrieren
                </Link>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="login-email">
                        E-Mail
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="email"
                            {...register('email')}
                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors"
                            placeholder="deine@email.de"
                        />
                    </div>
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="login-password">
                        Passwort
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            {...register('password')}
                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 py-2.5 text-white placeholder:text-gray-600 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                    )}
                </div>

                {serverError && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {serverError}
                    </div>
                )}

                <button
                    id="login-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 font-semibold text-white hover:from-orange-400 hover:to-amber-400 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 active:scale-98"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Anmelden...</span>
                        </>
                    ) : (
                        <span>Anmelden</span>
                    )}
                </button>
            </form>
        </>
    );
}

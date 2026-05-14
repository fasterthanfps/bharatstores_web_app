'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, Lock, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const RegisterSchema = z.object({
    email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein'),
    password: z
        .string()
        .min(8, 'Mindestens 8 Zeichen')
        .regex(/[A-Z]/, 'Mindestens einen Großbuchstaben')
        .regex(/[0-9]/, 'Mindestens eine Zahl'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState('');
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
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/25">
                    <CheckCircle className="h-7 w-7 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Fast geschafft!</h2>
                <p className="text-sm text-gray-400 mb-6">
                    Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte überprüfe dein Postfach.
                </p>
                <Link
                    href="/login"
                    className="text-sm text-orange-400 hover:text-orange-300"
                >
                    Zur Anmeldung
                </Link>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-2xl font-bold text-white mb-2">Konto erstellen</h1>
            <p className="text-sm text-gray-400 mb-8">
                Bereits registriert?{' '}
                <Link href="/login" className="text-orange-400 hover:text-orange-300">
                    Anmelden
                </Link>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="reg-email">
                        E-Mail
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            id="reg-email"
                            type="email"
                            {...register('email')}
                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors"
                            placeholder="deine@email.de"
                        />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="reg-password">
                        Passwort
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            id="reg-password"
                            type="password"
                            {...register('password')}
                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors"
                            placeholder="Mindestens 8 Zeichen"
                        />
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="reg-confirm">
                        Passwort bestätigen
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            id="reg-confirm"
                            type="password"
                            {...register('confirmPassword')}
                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors"
                            placeholder="Passwort wiederholen"
                        />
                    </div>
                    {errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
                    )}
                </div>

                {serverError && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {serverError}
                    </div>
                )}

                <button
                    id="register-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 font-semibold text-white hover:from-orange-400 hover:to-amber-400 disabled:opacity-70 transition-all shadow-lg shadow-orange-500/20"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Konto erstellen...</span>
                        </>
                    ) : (
                        <span>Konto erstellen</span>
                    )}
                </button>
            </form>
        </>
    );
}

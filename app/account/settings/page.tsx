'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, Lock, MapPin, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    
    // Form fields
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [city, setCity] = useState('');
    const [email, setEmail] = useState('');
    const [originalEmail, setOriginalEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Message states
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) throw error;
                
                if (user) {
                    setEmail(user.email || '');
                    setOriginalEmail(user.email || '');
                    setName(user.user_metadata?.name || '');
                    setUsername(user.user_metadata?.username || '');
                    setCity(user.user_metadata?.city || '');
                }
            } catch (err: any) {
                setErrorMessage(err.message || 'Failed to load user profile.');
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        // Validations
        if (password && password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        setUpdating(true);

        try {
            const updatePayload: any = {
                data: {
                    name,
                    username,
                    city
                }
            };

            // Only update email if it changed
            if (email !== originalEmail) {
                updatePayload.email = email;
            }

            // Only update password if provided
            if (password) {
                updatePayload.password = password;
            }

            const { data, error } = await supabase.auth.updateUser(updatePayload);

            if (error) throw error;

            let successText = 'Profile updated successfully!';
            if (email !== originalEmail) {
                successText += ' A confirmation link has been sent to your new email address.';
                setOriginalEmail(email);
            }
            if (password) {
                successText += ' Password changed successfully.';
                setPassword('');
                setConfirmPassword('');
            }

            setSuccessMessage(successText);
            
            // Refresh layout stats or greeting in case the email displayed changes
            router.refresh();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update profile.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-masala-primary animate-spin" />
                <p className="text-xs font-bold text-masala-text-muted">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-serif font-black text-masala-text">Account Settings</h2>
                <p className="text-xs text-masala-text-muted mt-0.5">
                    Update your profile information, email address, and security details.
                </p>
            </div>

            {successMessage && (
                <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-4 py-3 rounded-2xl border border-emerald-100 flex items-start gap-2.5 animate-fade-in">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-50 text-red-700 text-xs font-bold px-4 py-3 rounded-2xl border border-red-100 flex items-start gap-2.5 animate-fade-in">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Information Section */}
                <div className="bg-white rounded-3xl border border-masala-border/60 p-6 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-masala-primary/5 blur-xl pointer-events-none" />
                    
                    <div className="flex items-center gap-2 border-b border-masala-border/40 pb-3 mb-2">
                        <User className="h-4 w-4 text-masala-primary stroke-[2.5]" />
                        <h3 className="text-sm font-serif font-black text-masala-text">Profile Information</h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label htmlFor="name" className="text-[10px] font-bold text-masala-text-light uppercase tracking-wider block mb-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="w-full pl-9 pr-4 py-2 border border-masala-border/50 rounded-xl bg-masala-muted/10 outline-none focus:border-masala-primary/60 focus:ring-1 focus:ring-masala-primary/30 transition-all font-sans text-xs text-masala-text"
                                />
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-masala-text-muted stroke-[2]" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="username" className="text-[10px] font-bold text-masala-text-light uppercase tracking-wider block mb-1">
                                Username
                            </label>
                            <div className="relative">
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Choose a unique username"
                                    className="w-full pl-9 pr-4 py-2 border border-masala-border/50 rounded-xl bg-masala-muted/10 outline-none focus:border-masala-primary/60 focus:ring-1 focus:ring-masala-primary/30 transition-all font-sans text-xs text-masala-text"
                                />
                                <span className="absolute left-3 top-2 text-sm font-extrabold text-masala-text-muted">@</span>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="city" className="text-[10px] font-bold text-masala-text-light uppercase tracking-wider block mb-1">
                                City
                            </label>
                            <div className="relative">
                                <input
                                    id="city"
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="Enter your current city"
                                    className="w-full pl-9 pr-4 py-2 border border-masala-border/50 rounded-xl bg-masala-muted/10 outline-none focus:border-masala-primary/60 focus:ring-1 focus:ring-masala-primary/30 transition-all font-sans text-xs text-masala-text"
                                />
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-masala-text-muted stroke-[2]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Security Section */}
                <div className="bg-white rounded-3xl border border-masala-border/60 p-6 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-masala-accent/5 blur-xl pointer-events-none" />
                    
                    <div className="flex items-center gap-2 border-b border-masala-border/40 pb-3 mb-2">
                        <Lock className="h-4 w-4 text-masala-accent stroke-[2.5]" />
                        <h3 className="text-sm font-serif font-black text-masala-text">Security Settings</h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label htmlFor="email" className="text-[10px] font-bold text-masala-text-light uppercase tracking-wider block mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    className="w-full pl-9 pr-4 py-2 border border-masala-border/50 rounded-xl bg-masala-muted/10 outline-none focus:border-masala-primary/60 focus:ring-1 focus:ring-masala-primary/30 transition-all font-sans text-xs text-masala-text"
                                    required
                                />
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-masala-text-muted stroke-[2]" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="text-[10px] font-bold text-masala-text-light uppercase tracking-wider block mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters (leave blank to keep current)"
                                    className="w-full pl-9 pr-4 py-2 border border-masala-border/50 rounded-xl bg-masala-muted/10 outline-none focus:border-masala-primary/60 focus:ring-1 focus:ring-masala-primary/30 transition-all font-sans text-xs text-masala-text"
                                />
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-masala-text-muted stroke-[2]" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="text-[10px] font-bold text-masala-text-light uppercase tracking-wider block mb-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your new password"
                                    className="w-full pl-9 pr-4 py-2 border border-masala-border/50 rounded-xl bg-masala-muted/10 outline-none focus:border-masala-primary/60 focus:ring-1 focus:ring-masala-primary/30 transition-all font-sans text-xs text-masala-text"
                                />
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-masala-text-muted stroke-[2]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Action Button */}
                <div className="md:col-span-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={updating}
                        className="inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-masala-primary hover:bg-masala-secondary px-6 py-3 rounded-xl transition-all shadow-md shadow-masala-primary/15 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer min-w-[150px]"
                    >
                        {updating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving Changes...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

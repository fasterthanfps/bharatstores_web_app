'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, Suspense } from 'react';
import { LanguageProvider } from '@/lib/utils/LanguageContext';
import { ComparisonProvider } from '@/context/ComparisonContext';
import ComparisonTray from '@/components/comparison/ComparisonTray';
import GlobalLoader from '@/components/layout/GlobalLoader';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        retry: 2,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <ComparisonProvider>
                    <Suspense fallback={null}>
                        <GlobalLoader />
                    </Suspense>
                    {children}
                    <ComparisonTray />
                </ComparisonProvider>
            </LanguageProvider>
        </QueryClientProvider>
    );
}

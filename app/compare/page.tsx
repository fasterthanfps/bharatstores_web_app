import { Suspense } from 'react';
import CompareClient from './CompareClient';

export const dynamic = 'force-dynamic';

export default function ComparePage() {

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-masala-text-muted">Loading...</div>}>
      <CompareClient />
    </Suspense>
  );
}


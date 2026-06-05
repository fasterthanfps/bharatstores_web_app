'use client';

import { useState, useEffect, useMemo } from 'react';
import { getProductPlaceholder } from '@/lib/utils/image';

interface ProductPageImageProps {
    primaryImage: string | null;
    category: string;
    productName: string;
    alternativeImages: string[];
}

export default function ProductPageImage({
    primaryImage,
    category,
    productName,
    alternativeImages,
}: ProductPageImageProps) {
    const candidateImages = useMemo(() => {
        const urls = new Set<string>();
        if (primaryImage) urls.add(primaryImage);
        alternativeImages.forEach((img) => {
            if (img) urls.add(img);
        });
        const fallback = getProductPlaceholder(category, productName);
        return [...Array.from(urls), fallback];
    }, [primaryImage, alternativeImages, category, productName]);

    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        setImageIndex(0);
    }, [candidateImages]);

    const currentImgSrc = candidateImages[imageIndex];

    return (
        <img
            src={currentImgSrc}
            alt={productName}
            className="object-contain max-h-full max-w-full w-auto h-auto"
            onError={() => {
                if (imageIndex < candidateImages.length - 1) {
                    setImageIndex((prev) => prev + 1);
                }
            }}
        />
    );
}

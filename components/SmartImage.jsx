import Image from 'next/image';
import React from 'react';
/**
 * SmartImage enforces width/height, responsive sizes, async decoding, and format negotiation (AVIF/WebP via Next.js).
 * It defaults to eager loading only when not marked belowTheFold.
 */
export function SmartImage({ belowTheFold = false, sizes = '100vw', alt, ...rest }) {
    // Ensure width/height provided
    if (!rest.width || !rest.height) {
        throw new Error('SmartImage requires explicit width and height');
    }
    const loading = belowTheFold ? 'lazy' : 'eager';
    // decoding="async" not directly on <Image/>; Next sets decoding automatically. We'll pass unoptimized flag? Not needed.
    return <Image {...rest} alt={alt} loading={loading} sizes={sizes}/>;
}
export default SmartImage;

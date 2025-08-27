import Image, { ImageProps } from 'next/image';
import React from 'react';

export interface SmartImageProps extends Omit<ImageProps,'loading'|'sizes'|'blurDataURL'> {
  belowTheFold?: boolean; // if true -> lazy
  sizes?: string; // optional override, defaults to responsive full width
}

/**
 * SmartImage enforces width/height, responsive sizes, async decoding, and format negotiation (AVIF/WebP via Next.js).
 * It defaults to eager loading only when not marked belowTheFold.
 */
export function SmartImage({ belowTheFold=false, sizes='100vw', alt, ...rest }: SmartImageProps){
  // Ensure width/height provided
  if(!(rest as any).width || !(rest as any).height){
    throw new Error('SmartImage requires explicit width and height');
  }
  const loading = belowTheFold ? 'lazy' : 'eager';
  // decoding="async" not directly on <Image/>; Next sets decoding automatically. We'll pass unoptimized flag? Not needed.
  return <Image {...rest} alt={alt} loading={loading} sizes={sizes} />;
}
export default SmartImage;

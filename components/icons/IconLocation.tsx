import React from 'react';

export interface IconProps {
  size?: 20 | 24 | number;
  color?: string;
  title?: string;
  className?: string;
}

const IconLocation: React.FC<IconProps> = ({
  size = 24,
  color = 'var(--color-primary-600)',
  title = 'Pickup location icon',
  className = ''
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    role="img"
    aria-hidden={title ? undefined : true}
    aria-label={title || undefined}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {title ? <title>{title}</title> : null}
    <defs>
      <linearGradient id="pickupGradient" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={color} stopOpacity="0.92" />
        <stop offset="1" stopColor="var(--color-primary-800, #1e40af)" />
      </linearGradient>
    </defs>
    <path
      fill="url(#pickupGradient)"
      d="M16 2c-6.07 0-11 4.82-11 10.77 0 3.56 1.83 6.72 4.35 9.77 1.88 2.26 4.08 4.38 6.01 6.53a1.6 1.6 0 0 0 2.28 0c1.93-2.15 4.13-4.27 6.01-6.53 2.52-3.05 4.35-6.21 4.35-9.77C27 6.82 22.07 2 16 2Zm0 15.22c-2.73 0-4.94-2.13-4.94-4.77S13.27 7.68 16 7.68s4.94 2.13 4.94 4.77S18.73 17.22 16 17.22Z"
    />
    <circle
      cx="16"
      cy="12.45"
      r="3.3"
      fill="#fff"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="0.6"
    />
  </svg>
);

export default IconLocation;

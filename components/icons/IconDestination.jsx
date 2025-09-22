import React from 'react';

const IconDestination = ({
  size = 24,
  color = 'var(--color-secondary-500)',
  title = 'Drop location icon',
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
      <linearGradient id="dropGradient" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={color} stopOpacity="0.9" />
        <stop offset="1" stopColor="var(--color-secondary-700, #15803d)" />
      </linearGradient>
    </defs>
    <path
      fill="url(#dropGradient)"
      d="M16 3.2c-5.36 0-9.7 4.11-9.7 9.18 0 3.08 1.54 5.78 3.63 8.31l5.28 6.24c.43.5 1.19.5 1.62 0l5.28-6.24c2.1-2.53 3.63-5.23 3.63-8.31 0-5.07-4.34-9.18-9.74-9.18Zm0 13.13a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
    />
    <path
      d="M21.2 25.4c-1.18.77-3.32 1.61-5.2 3-1.88-1.39-4.02-2.23-5.2-3-.85-.55-2.09.05-1.89 1.06.42 2.09 1.79 3.74 4.46 4.9 1.01.44 2.25.64 3.63.64s2.62-.2 3.63-.64c2.67-1.16 4.04-2.81 4.46-4.9.2-1.01-1.04-1.61-1.89-1.06Z"
      fill="rgba(15, 118, 110, 0.2)"
    />
  </svg>
);

export default IconDestination;

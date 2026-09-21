import React from 'react';
import logo from '../assets/logo.png';

const SiyasatLogo = ({ variant = 'maroon', size = 'md', className = '' }) => {
  // We can eventually add logo-white.png for variant === 'white' if provided by user.
  // For now, we use the single logo placeholder.

  // Size styling map
  const heightClasses = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-14',
    xl: 'h-24'
  };

  const currentHeight = heightClasses[size] || 'h-9';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={logo}
        alt="SIYASAT Logo"
        className={`${currentHeight} w-auto object-contain`}
      />
    </div>
  );
};

export default SiyasatLogo;

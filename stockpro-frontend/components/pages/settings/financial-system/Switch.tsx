import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  variant?: 'danger' | 'primary';
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, description, disabled = false, variant = 'primary' }) => {
  // Using Royal Blue (royal-600) for primary and Red for danger
  const activeColor = variant === 'danger' ? 'bg-red-700' : 'bg-royal-600';

  return (
    <div className="flex items-start justify-between py-3 group cursor-pointer" onClick={() => !disabled && onChange(!checked)}>
      <div className="flex flex-col flex-1 pl-4">
        {label && (
          <span className={`text-sm font-bold transition-colors ${disabled ? 'text-gray-400' : 'text-royal-900 group-hover:text-royal-600'}`}>
            {label}
          </span>
        )}
        {description && <span className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`${
          checked ? activeColor : 'bg-gray-200'
        } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-royal-500 focus:ring-offset-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`${
            checked ? '-translate-x-4' : 'translate-x-0'
          } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
};
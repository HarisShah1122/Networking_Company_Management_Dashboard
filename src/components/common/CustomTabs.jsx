import { useState } from 'react';

export default function CustomTabs({
  tabs = [],
  defaultValue,
  value: controlledValue,
  onChange,
  variant = 'default',
  className = '',
  ...props
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? tabs[0]?.value ?? '');
  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  const handleChange = (newValue) => {
    if (isControlled && onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  if (tabs.length === 0) {
    return null;
  }

  const variantClasses = {
    default: 'border-b border-gray-200',
    underline: 'border-b-2 border-gray-200',
    pills: 'bg-gray-100 rounded-lg p-1',
  };

  const tabButtonClasses = {
    default: 'px-4 py-2 border-b-2 border-transparent hover:border-gray-300',
    underline: 'px-4 py-2 border-b-2 border-transparent hover:border-gray-400',
    pills: 'px-4 py-2 rounded-md',
  };

  const activeTabClasses = {
    default: 'border-indigo-600 text-indigo-600',
    underline: 'border-indigo-600 text-indigo-600 font-medium',
    pills: 'bg-white text-indigo-600 shadow-sm',
  };

  return (
    <div className={className} {...props}>
      <div className={variantClasses[variant]}>
        <nav className="flex space-x-1" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => !tab.disabled && handleChange(tab.value)}
              disabled={tab.disabled}
              className={`
                ${tabButtonClasses[variant]}
                ${activeValue === tab.value ? activeTabClasses[variant] : 'text-gray-600 hover:text-gray-800'}
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                flex items-center gap-2 transition-colors
              `}
            >
              {tab.icon && <span>{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.value}
            className={activeValue === tab.value ? 'block' : 'hidden'}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export function useTabs(defaultValue = '') {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return {
    activeTab,
    setActiveTab,
    handleTabChange: setActiveTab,
  };
}


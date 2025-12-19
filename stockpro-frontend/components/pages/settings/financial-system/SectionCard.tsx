import React from 'react';

interface SectionCardProps {
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
  description?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, icon: Icon, children, description }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
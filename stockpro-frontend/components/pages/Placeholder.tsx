import React from "react";

interface PlaceholderProps {
  title: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-dark">{title}</h1>
        <p className="text-gray-500 mt-2">هذه الصفحة قيد الانشاء.</p>
      </div>
    </div>
  );
};

export default Placeholder;

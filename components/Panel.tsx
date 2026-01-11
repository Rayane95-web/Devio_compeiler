
import React from 'react';

interface PanelProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  isDarkMode?: boolean;
}

const Panel: React.FC<PanelProps> = ({ title, icon, children, className = '', actions, isDarkMode = true }) => {
  return (
    <div className={`flex flex-col rounded-lg overflow-hidden border transition-colors duration-300
      ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} 
      ${className}`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b transition-colors duration-300
        ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-100/50 border-slate-200'}`}>
        <div className={`flex items-center gap-2 text-sm font-semibold transition-colors duration-300
          ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          {icon}
          {title}
        </div>
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        {children}
      </div>
    </div>
  );
};

export default Panel;

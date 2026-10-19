import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { ConnectionIndicator } from '../common/ConnectionIndicator';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 z-20 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="sm:hidden p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <ConnectionIndicator />
      </div>
    </header>
  );
};

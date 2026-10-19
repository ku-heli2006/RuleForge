import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  PlayCircle,
  ShieldCheck,
  Compass,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/rulesets', label: 'Rulesets', icon: Layers },
    { to: '/playground', label: 'Evaluation Playground', icon: PlayCircle },
    { to: '/verification', label: 'Verification', icon: ShieldCheck },
    { to: '/counterfactual', label: 'Counterfactual Explorer', icon: Compass },
    { to: '/backtesting', label: 'Backtesting', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-all duration-200 z-30 shrink-0 select-none',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand logo header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-sm tracking-tight block">RuleForge</span>
              <span className="text-[10px] text-slate-400 block truncate font-mono uppercase tracking-wider">
                Verifiable Rules
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer group',
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer & collapse toggle */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="text-[11px] text-slate-400 font-mono">
            <span className="text-slate-400">SMT:</span> <span className="text-emerald-400">Z3 Ready</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer',
            isCollapsed && 'w-full flex justify-center'
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

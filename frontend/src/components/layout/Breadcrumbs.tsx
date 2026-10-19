import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  rulesets: 'Rulesets',
  playground: 'Evaluation Playground',
  verification: 'Formal Verification',
  counterfactual: 'Counterfactual Explorer',
  backtesting: 'Historical Backtesting',
  settings: 'Settings & Connectivity',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center text-xs text-slate-500 font-medium">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">RuleForge</span>
      </Link>

      {pathnames.map((segment, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = ROUTE_LABELS[segment] || segment;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3 h-3 text-slate-400 mx-1.5 shrink-0" />
            {isLast ? (
              <span className="text-slate-900 font-semibold truncate max-w-[200px]">
                {label}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-slate-900 transition-colors truncate max-w-[150px]"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

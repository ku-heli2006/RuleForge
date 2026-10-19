import React from 'react';
import { tokenizeExpression } from '../../lib/dsl-parser';
import { cn } from '../../lib/utils';

interface RuleSyntaxHighlighterProps {
  expression: string;
  className?: string;
}

export const RuleSyntaxHighlighter: React.FC<RuleSyntaxHighlighterProps> = ({
  expression,
  className,
}) => {
  const tokens = tokenizeExpression(expression);

  return (
    <div
      className={cn(
        'font-mono text-xs px-2.5 py-1.5 rounded bg-slate-900 text-slate-100 overflow-x-auto leading-relaxed border border-slate-800 shadow-xs',
        className
      )}
    >
      {tokens.map((token, index) => {
        if (token.type === 'keyword') {
          return (
            <span key={index} className="text-purple-400 font-bold">
              {token.text}
            </span>
          );
        }
        if (token.type === 'operator') {
          return (
            <span key={index} className="text-amber-400 font-semibold px-0.5">
              {token.text}
            </span>
          );
        }
        if (token.type === 'field') {
          return (
            <span key={index} className="text-sky-300 font-medium">
              {token.text}
            </span>
          );
        }
        if (token.type === 'paren') {
          return (
            <span key={index} className="text-slate-400 font-bold">
              {token.text}
            </span>
          );
        }
        if (token.type === 'value') {
          return (
            <span key={index} className="text-emerald-300">
              {token.text}
            </span>
          );
        }
        return <span key={index}>{token.text}</span>;
      })}
    </div>
  );
};

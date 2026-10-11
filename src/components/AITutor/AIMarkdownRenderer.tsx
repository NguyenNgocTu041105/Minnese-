import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Volume2, BookOpen, Lightbulb, Sparkles } from 'lucide-react';
import { playChineseAudio } from '../../utils/chineseAudio';

interface AIMarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Pre-processes raw AI markdown string to clean up excessive asterisks (***),
 * trailing hashes, and weird formatting artifacts.
 */
function cleanMarkdownArtifacts(text: string): string {
  if (!text) return '';
  return text
    // Replace triple asterisks ***text*** with clean **text**
    .replace(/\*\*\*(.*?)\*\*\*/g, '**$1**')
    // Remove isolated arbitrary multiple asterisks or hash tags
    .replace(/\*{4,}/g, '**')
    .replace(/#{4,}/g, '###')
    // Format bullet points cleanly
    .replace(/^\s*[\*\•]\s+/gm, '- ')
    .trim();
}

/**
 * Checks if a string contains Chinese characters
 */
function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}

export const AIMarkdownRenderer: React.FC<AIMarkdownRendererProps> = ({ content, className = '' }) => {
  const cleanedContent = cleanMarkdownArtifacts(content);

  return (
    <div className={`ai-markdown-content space-y-3 text-[var(--color-text-primary)] leading-relaxed ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <div className="mt-3 mb-2 pt-2 border-b border-[var(--color-primary)]/20 pb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-[var(--color-primary)] shrink-0"></span>
              <h1 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] tracking-tight">
                {children}
              </h1>
            </div>
          ),
          h2: ({ children }) => (
            <div className="mt-3 mb-2 flex items-center gap-2">
              <span className="w-1 h-3.5 rounded-full bg-[var(--color-primary)] shrink-0"></span>
              <h2 className="text-sm sm:text-base font-bold text-[var(--color-primary-dark)] dark:text-[var(--color-primary)]">
                {children}
              </h2>
            </div>
          ),
          h3: ({ children }) => (
            <div className="mt-2.5 mb-1.5 flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-sky-500 shrink-0"></span>
              <h3 className="text-xs sm:text-sm font-bold text-sky-700 dark:text-sky-300">
                {children}
              </h3>
            </div>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-bold text-[var(--color-text-primary)] mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => {
            return (
              <p className="text-xs sm:text-sm text-[var(--color-text-primary)] leading-relaxed break-words my-1.5">
                {children}
              </p>
            );
          },
          strong: ({ children }) => {
            const rawText = String(children);
            const isChinese = containsChinese(rawText);
            return (
              <strong
                className={`font-semibold ${
                  isChinese
                    ? 'text-[var(--color-primary-dark)] dark:text-[var(--color-primary)] font-chinese px-1 py-0.5 rounded bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20'
                    : 'text-amber-700 dark:text-amber-300 font-semibold'
                }`}
              >
                {children}
              </strong>
            );
          },
          em: ({ children }) => (
            <em className="text-[var(--color-text-secondary)] italic not-italic:font-normal font-sans">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2 pl-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-2 pl-2 list-decimal list-inside text-xs sm:text-sm text-[var(--color-text-primary)]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-xs sm:text-sm text-[var(--color-text-primary)] flex items-start gap-2 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0 mt-2"></span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          blockquote: ({ children }) => (
            <div className="p-3 my-2.5 rounded-xl bg-[var(--color-surface)] border-l-3 border-[var(--color-primary)] text-xs sm:text-sm text-[var(--color-text-secondary)] space-y-1 shadow-xs">
              {children}
            </div>
          ),
          code: ({ children, className }) => {
            const isBlock = Boolean(className);
            return isBlock ? (
              <pre className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-xs text-[var(--color-primary-dark)] dark:text-[var(--color-primary)] overflow-x-auto my-2">
                <code>{children}</code>
              </pre>
            ) : (
              <code className="px-1.5 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] font-mono text-[11px] text-[var(--color-primary-dark)] dark:text-[var(--color-primary)] font-bold">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-[var(--color-border)]">
              <table className="min-w-full divide-y divide-[var(--color-border)] text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[var(--color-border)]/60 bg-[var(--color-background)] text-[var(--color-text-primary)]">{children}</tbody>
          ),
          tr: ({ children }) => <tr className="hover:bg-[var(--color-surface)] transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-bold tracking-wider">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-xs leading-relaxed">{children}</td>,
          hr: () => <hr className="border-t border-[var(--color-border)] my-3" />,
        }}
      >
        {cleanedContent}
      </Markdown>
    </div>
  );
};

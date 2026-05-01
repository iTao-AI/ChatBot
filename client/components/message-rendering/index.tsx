'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.min.css';
import { useState, useRef, useCallback, ComponentProps } from 'react';

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
      aria-label={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

const codeBlockHandler = ({ className, children, ...props }: ComponentProps<'code'>) => {
  const match = /language-(\w+)/.exec(className ?? '');
  const isInline = !match && !String(children).includes('\n');

  if (isInline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  const code = String(children).replace(/\n$/, '');

  return (
    <div className="relative group">
      <CopyButton code={code} />
      <pre className="!mt-0">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

export function MessageContent({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none dark:prose-headings:text-white prose-headings:text-gray-100 prose-a:text-blue-400 prose-code:text-pink-300 prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight, rehypeKatex]}
        components={{ code: codeBlockHandler }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

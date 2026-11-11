import React from 'react';

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  // Simple, clean markdown line-by-line renderer
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockLang = '';
  let inFrontmatter = false;
  let frontmatterLines: string[] = [];

  lines.forEach((line, idx) => {
    // Frontmatter delimiter
    if (idx === 0 && line.trim() === '---') {
      inFrontmatter = true;
      return;
    }
    if (inFrontmatter) {
      if (line.trim() === '---') {
        inFrontmatter = false;
        elements.push(
          <div key={`fm-${idx}`} className="mb-6 p-3.5 rounded-lg bg-[#0d0f17] border border-[#232736] font-mono text-xs text-slate-400">
            <div className="text-[10px] tracking-wider uppercase text-emerald-400 font-semibold mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Frontmatter Metadata
            </div>
            {frontmatterLines.map((fl, fIdx) => (
              <div key={fIdx} className="leading-relaxed">
                <span className="text-slate-300 font-medium">{fl.split(':')[0]}:</span>
                <span className="text-slate-400">{fl.substring(fl.indexOf(':') + 1)}</span>
              </div>
            ))}
          </div>
        );
        return;
      }
      frontmatterLines.push(line);
      return;
    }

    // Code block
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.replace('```', '').trim();
        codeBlockLines = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <div key={`code-${idx}`} className="my-4 rounded-lg bg-[#090a0f] border border-[#232736] overflow-hidden">
            {codeBlockLang && (
              <div className="px-3.5 py-1.5 bg-[#141620] border-b border-[#232736] text-[11px] font-mono text-slate-400 flex justify-between items-center">
                <span>{codeBlockLang}</span>
              </div>
            )}
            <pre className="p-3.5 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        );
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Headers
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={idx} className="text-2xl font-bold text-slate-100 tracking-tight mt-6 mb-3 pb-2 border-b border-[#232736]">
          {line.replace('# ', '')}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={idx} className="text-xl font-semibold text-slate-100 tracking-tight mt-5 mb-2.5">
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="text-base font-semibold text-slate-200 mt-4 mb-2">
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('> ')) {
      // Blockquote / alert
      elements.push(
        <blockquote key={idx} className="my-3 pl-3.5 py-1 border-l-2 border-emerald-500/80 bg-emerald-950/20 text-slate-300 text-sm italic rounded-r">
          {line.replace('> ', '')}
        </blockquote>
      );
    } else if (line.trim().startsWith('- [ ] ')) {
      // Unchecked task
      elements.push(
        <div key={idx} className="flex items-center gap-2.5 my-1 text-sm text-slate-300">
          <span className="w-3.5 h-3.5 rounded border border-slate-600 inline-block bg-slate-900/50" />
          <span>{line.replace('- [ ] ', '')}</span>
        </div>
      );
    } else if (line.trim().startsWith('- [x] ') || line.trim().startsWith('- [X] ')) {
      // Checked task
      elements.push(
        <div key={idx} className="flex items-center gap-2.5 my-1 text-sm text-slate-400 line-through">
          <span className="w-3.5 h-3.5 rounded border border-emerald-500/80 inline-flex items-center justify-center bg-emerald-950/80 text-[10px] text-emerald-400 font-bold">
            ✓
          </span>
          <span>{line.replace(/- \[[xX]\] /, '')}</span>
        </div>
      );
    } else if (line.trim().startsWith('- ')) {
      // Bullet list
      elements.push(
        <li key={idx} className="ml-5 list-disc text-sm text-slate-300 my-1 leading-relaxed">
          {line.replace('- ', '')}
        </li>
      );
    } else if (line.trim() === '---') {
      elements.push(<hr key={idx} className="my-5 border-[#232736]" />);
    } else if (line.trim() === '') {
      elements.push(<div key={idx} className="h-2" />);
    } else {
      elements.push(
        <p key={idx} className="text-sm text-slate-300 leading-relaxed my-1.5">
          {line}
        </p>
      );
    }
  });

  return <div className="markdown-body space-y-0.5 select-text">{elements}</div>;
};


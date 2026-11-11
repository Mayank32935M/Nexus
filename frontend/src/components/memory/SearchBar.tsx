import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { SearchResult } from '../../types';

interface Props {
  onSearch: (query: string, category?: string) => void;
  results: SearchResult[];
  onSelectResult: (path: string) => void;
  isSearching: boolean;
}

export const SearchBar: React.FC<Props> = ({
  onSearch,
  results,
  onSelectResult,
  isSearching,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'CORE', label: 'CORE' },
    { value: 'PROJECTS', label: 'PROJECTS' },
    { value: 'KNOWLEDGE', label: 'KNOWLEDGE' },
    { value: 'DECISIONS', label: 'DECISIONS' },
    { value: 'SESSION-HISTORY', label: 'SESSION-HISTORY' },
    { value: 'AI-HANDOFF', label: 'AI-HANDOFF' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val, category || undefined);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value;
    setCategory(cat);
    onSearch(query, cat || undefined);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('', category || undefined);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search across all memory documents (FTS5 indexed)..."
            className="w-full pl-9 pr-8 py-2 bg-[#11131a] border border-[#232736] rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500/80 transition-colors"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={category}
          onChange={handleCategoryChange}
          className="px-3 py-2 bg-[#11131a] border border-[#232736] rounded-lg text-xs font-mono text-slate-300 focus:outline-hidden focus:border-emerald-500/80"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results Dropdown */}
      {query.trim().length > 0 && (
        <div className="p-2 rounded-lg bg-[#0d0f17] border border-[#232736] max-h-72 overflow-y-auto space-y-1 shadow-xl">
          <div className="px-2 py-1 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>{results.length} results found</span>
            {isSearching && <span className="text-emerald-400">Searching...</span>}
          </div>

          {results.map((r) => (
            <button
              key={r.path}
              onClick={() => onSelectResult(r.path)}
              className="w-full p-2.5 rounded-md hover:bg-[#181b26] transition-colors text-left border border-transparent hover:border-[#2b334a]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-200 truncate">{r.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1b1f2b] text-emerald-400 border border-emerald-900/40">
                  {r.category}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate">{r.path}</div>
              {r.snippet && (
                <div
                  className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed bg-[#11131a]/60 p-1.5 rounded text-[11px]"
                  dangerouslySetInnerHTML={{ __html: r.snippet }}
                />
              )}
            </button>
          ))}

          {results.length === 0 && !isSearching && (
            <div className="py-4 text-center text-xs text-slate-400 font-mono">
              No matching documents found in memory vault.
            </div>
          )}
        </div>
      )}
    </div>
  );
};


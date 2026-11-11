import React, { useState } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { MemoryTreeNode } from '../../types';

interface Props {
  tree: MemoryTreeNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

const TreeNodeItem: React.FC<{
  node: MemoryTreeNode;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  depth: number;
}> = ({ node, selectedPath, onSelectFile, depth }) => {
  const [isOpen, setIsOpen] = useState(depth === 0 || depth === 1);

  if (node.type === 'directory') {
    return (
      <div className="select-none">
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-xs font-mono text-slate-300 hover:text-slate-100 hover:bg-[#181b24] transition-colors text-left"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="w-4 h-4 text-emerald-400/80 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-emerald-500/60 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>

        {isOpen && node.children && (
          <div className="space-y-0.5">
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedPath === node.path;

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
      className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-xs font-mono transition-colors text-left truncate ${
        isSelected
          ? 'bg-[#181b26] text-emerald-400 border border-[#2b334a]'
          : 'text-slate-400 hover:text-slate-200 hover:bg-[#141620]'
      }`}
    >
      <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
      <span className="truncate">{node.name}</span>
    </button>
  );
};

export const VaultTree: React.FC<Props> = ({ tree, selectedPath, onSelectFile }) => {
  return (
    <div className="space-y-0.5 py-2">
      {tree.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          depth={0}
        />
      ))}
      {tree.length === 0 && (
        <div className="text-center py-8 text-xs text-slate-400 font-mono">
          Memory vault is empty.
        </div>
      )}
    </div>
  );
};


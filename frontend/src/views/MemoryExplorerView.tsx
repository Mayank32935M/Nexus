import React, { useState, useEffect } from 'react';
import { MemoryDocument, MemoryTreeNode, SearchResult } from '../types';
import { VaultTree } from '../components/memory/VaultTree';
import { DocumentViewer } from '../components/memory/DocumentViewer';
import { SearchBar } from '../components/memory/SearchBar';
import { ProposeUpdateModal } from '../components/memory/ProposeUpdateModal';
import { api } from '../api/client';
import { FolderTree, RefreshCw } from 'lucide-react';

interface Props {
  tree: MemoryTreeNode[];
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
  onRefreshVault: () => void;
}

export const MemoryExplorerView: React.FC<Props> = ({
  tree,
  selectedPath,
  onSelectPath,
  onRefreshVault,
}) => {
  const [document, setDocument] = useState<MemoryDocument | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProposing, setIsProposing] = useState(false);
  const [proposalData, setProposalData] = useState<{ path: string; content: string }>({ path: '', content: '' });

  // Load document when selectedPath changes
  useEffect(() => {
    if (selectedPath) {
      setIsLoadingDoc(true);
      api
        .readMemoryFile(selectedPath)
        .then((doc) => setDocument(doc))
        .catch((err) => {
          console.error('Failed reading file:', err);
          setDocument(null);
        })
        .finally(() => setIsLoadingDoc(false));
    }
  }, [selectedPath]);

  const handleSearch = async (query: string, category?: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const res = await api.searchMemory(query, category);
      setSearchResults(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveContent = async (path: string, content: string) => {
    await api.writeMemoryFile(path, content, false);
    const updated = await api.readMemoryFile(path);
    setDocument(updated);
    onRefreshVault();
  };

  const handleTriggerPropose = (path: string, currentContent: string) => {
    setProposalData({ path, content: currentContent });
    setIsProposing(true);
  };

  const handleSubmitProposal = async (filePath: string, proposedContent: string, reason: string) => {
    await api.proposeUpdate(filePath, proposedContent, reason);
    onRefreshVault();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left Navigation Tree & Search */}
      <div className="w-80 flex flex-col bg-[#11131a] rounded-xl border border-[#232736] p-4 shrink-0 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-[#232736] mb-3">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-100 font-mono">VAULT EXPLORER</h3>
          </div>
          <button
            onClick={onRefreshVault}
            className="p-1 rounded text-slate-400 hover:text-emerald-400 transition-colors"
            title="Reload vault"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Full-text search engine input */}
        <SearchBar
          onSearch={handleSearch}
          results={searchResults}
          onSelectResult={(p) => {
            onSelectPath(p);
            setSearchResults([]);
          }}
          isSearching={isSearching}
        />

        {/* Tree Explorer */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1">
          <VaultTree
            tree={tree}
            selectedPath={selectedPath}
            onSelectFile={onSelectPath}
          />
        </div>
      </div>

      {/* Right Document Viewer / Editor */}
      <div className="flex-1 h-full min-w-0">
        <DocumentViewer
          document={document}
          onSaveContent={handleSaveContent}
          onProposeUpdate={handleTriggerPropose}
          isLoading={isLoadingDoc}
        />
      </div>

      {/* Propose Update Modal for governed files */}
      <ProposeUpdateModal
        isOpen={isProposing}
        onClose={() => setIsProposing(false)}
        filePath={proposalData.path}
        initialContent={proposalData.content}
        onSubmit={handleSubmitProposal}
      />
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, Loader } from 'lucide-react';

const SearchPalette = ({ isOpen, onClose, papers, onSearch, selectedPaperIds, setSelectedPaperIds }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSelectedPaperIds([]);
    }
  }, [isOpen, setSelectedPaperIds]);

  const handlePaperToggle = (paperId) => {
    setSelectedPaperIds(prev => 
      prev.includes(paperId)
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
    );
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const result = await onSearch(query, selectedPaperIds);
      setSearchResult(result);
      setQuery('');
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setSearchResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`search-overlay ${isOpen ? 'open' : ''}`} onClick={handleClose}>
      <div className="search-container" onClick={e => e.stopPropagation()}>
        <div className="search-header">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Ask anything about your papers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query && selectedPaperIds.length > 0) {
                  handleSearch();
                }
              }}
            />
          </div>
          <div className="close-hint">
            <span className="kbd">esc</span>
            <span className="hint-text">to close</span>
          </div>
        </div>

        {!searchResult ? (
          <>
            <div className="context-papers">
              {papers.map(paper => (
                <div
                  key={paper.id}
                  className={`context-paper ${selectedPaperIds.includes(paper.id) ? 'selected' : ''}`}
                  onClick={() => handlePaperToggle(paper.id)}
                >
                  <div className="context-paper-checkbox">
                    {selectedPaperIds.includes(paper.id) && (
                      <Check size={14} color="white" />
                    )}
                  </div>
                  <span>{paper.title || paper.name}</span>
                </div>
              ))}
            </div>

            <div className="search-footer">
              <span className="selected-count">
                {selectedPaperIds.length} papers selected
              </span>
              <button
                className="search-button"
                disabled={!query.trim() || selectedPaperIds.length === 0 || isSearching}
                onClick={handleSearch}
              >
                {isSearching ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="search-results">
            <div className="search-result-content">
              {searchResult.split('\n').map((paragraph, index) => {
                const cleanText = paragraph.replace(/\*/g, '').trim();
                if (!cleanText) return null;
                
                return (
                  <p key={index} className="search-result-paragraph">
                    {cleanText}
                  </p>
                );
              })}
            </div>
            <div className="search-footer">
              <button
                className="search-button"
                onClick={() => setSearchResult(null)}
              >
                New Search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPalette; 
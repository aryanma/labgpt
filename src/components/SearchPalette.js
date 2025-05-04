import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Search, Check, Loader } from 'lucide-react';

const SearchPalette = forwardRef(({ 
    isOpen, 
    onClose, 
    papers, 
    onSearch, 
    selectedPaperIds, 
    setSelectedPaperIds, 
    isGeminiLoading, 
    totalPages, 
    setTotalPages, 
    query, 
    setQuery 
}, ref) => {
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState('');
    const inputRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Expose setSearchResult to parent
    useImperativeHandle(ref, () => ({
        setSearchResult
    }));

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
        if (!query.trim() || selectedPaperIds.length === 0) return;
        
        setIsSearching(true);
        try {
            const result = await onSearch(query, selectedPaperIds);
            setSearchResult(result);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleClose = () => {
        setQuery('');
        setSearchResult(null);
        setSelectedPaperIds([]);
        onClose();
    };

    const handleNewSearch = () => {
        setSearchResult(null);
        setQuery('');
        setSelectedPaperIds([]);
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

                {!searchResult && (
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
                )}

                {searchResult && (
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

                        {totalPages > 1 && (
                            <div className="pagination-controls">
                                <button
                                    className="pagination-button"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                >
                                    Previous
                                </button>
                                <span className="pagination-info">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="pagination-button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}

                        <div className="search-footer">
                            <div className="search-actions">
                                <button
                                    className="search-button"
                                    onClick={handleNewSearch}
                                >
                                    New Search
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isGeminiLoading && (
                    <div className="search-loading">
                        <div className="spinner"></div>
                        <p>Analyzing papers and generating response...</p>
                    </div>
                )}
            </div>
        </div>
    );
});

export default SearchPalette; 
import React, { useState, useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, Search, Check, X } from 'lucide-react';
import 'regenerator-runtime/runtime';

const VoiceSearch = ({ onVoiceInput, selectedPaper, papers = [] }) => {
    const [isListening, setIsListening] = useState(false);
    const [selectedPaperIds, setSelectedPaperIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPaperSelection, setShowPaperSelection] = useState(false);
    
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    // Initialize with the selected paper if there is one
    useEffect(() => {
        if (selectedPaper && !selectedPaperIds.includes(selectedPaper.id)) {
            setSelectedPaperIds([selectedPaper.id]);
        }
    }, [selectedPaper, selectedPaperIds]);

    // Move these two functions above the useEffect that uses them
    const handleCancelSearch = useCallback(() => {
        SpeechRecognition.stopListening();
        setIsListening(false);
        setShowPaperSelection(false);
        setSearchQuery('');
        resetTranscript();
    }, [resetTranscript]);

    const handleExecuteSearch = useCallback(() => {
        if (searchQuery && selectedPaperIds.length > 0) {
            onVoiceInput({
                type: 'search',
                query: searchQuery,
                paperIds: selectedPaperIds
            });
            // Reset states
            SpeechRecognition.stopListening();
            setIsListening(false);
            setShowPaperSelection(false);
            setSearchQuery('');
        }
    }, [searchQuery, selectedPaperIds, onVoiceInput]);

    // Process voice commands
    useEffect(() => {
        if (listening && transcript) {
            const command = transcript.toLowerCase();
            console.log("Current transcript:", command);
            
            // When already in paper selection mode
            if (showPaperSelection) {
                // Handle execution commands
                if (command.includes('go') || 
                    command.includes('search now') || 
                    command.includes('execute') || 
                    command.includes('run search')) {
                    console.log("Executing search with query:", searchQuery);
                    handleExecuteSearch();
                    resetTranscript();
                }
                // Handle select all command
                else if (command.includes('select all') || command.includes('all papers')) {
                    console.log("Selecting all papers");
                    setSelectedPaperIds(papers.map(paper => paper.id));
                    resetTranscript();
                }
                // Handle cancel command
                else if (command.includes('cancel') || command.includes('stop')) {
                    console.log("Canceling search");
                    handleCancelSearch();
                    resetTranscript();
                }
            }
            // When not in paper selection mode, detect initial search commands
            else if ((command.startsWith('search') || command.startsWith('find')) && !showPaperSelection) {
                const query = command.replace(/^(search|find)\s+/i, '').trim();
                
                // Detect if this might be a search query with sufficient content
                if (query && query.length > 3) {
                    console.log("Possible search query detected:", query);
                    
                    // Use a pause detection system
                    let lastTranscript = transcript;
                    let pauseTimer = null;
                    
                    // Set up a timer to check for pauses in speech
                    pauseTimer = setTimeout(() => {
                        // If transcript hasn't changed in the pause duration, consider it complete
                        if (lastTranscript === transcript) {
                            console.log("Pause detected, processing search query:", query);
                            
                            setSearchQuery(query);
                            // Reset selection and default to current paper
                            setSelectedPaperIds(selectedPaper ? [selectedPaper.id] : []);
                            
                            // Show paper selection
                            setShowPaperSelection(true);
                            resetTranscript();
                        }
                    }, 2000); // 2-second pause detection
                    
                    return () => {
                        if (pauseTimer) clearTimeout(pauseTimer);
                    };
                }
            }
            // Handle specific paper selection commands
            else if ((command.startsWith('select') || command.startsWith('choose')) && !command.includes('search')) {
                setShowPaperSelection(true);
                resetTranscript();
            }
            // Handle specific paper questions (when a paper is already selected)
            else if (selectedPaper && command.length > 10 && !showPaperSelection && !command.startsWith('search') && !command.startsWith('find')) {
                onVoiceInput({ 
                    type: 'question', 
                    text: transcript 
                });
                // Auto-close the voice input after processing
                setIsListening(false);
                resetTranscript();
            }
        }
    }, [listening, transcript, selectedPaper, papers, showPaperSelection, searchQuery, selectedPaperIds, handleCancelSearch, handleExecuteSearch, onVoiceInput, resetTranscript]);

    const handleToggleListening = () => {
        if (isListening) {
            SpeechRecognition.stopListening();
            setIsListening(false);
            setShowPaperSelection(false);
        } else {
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true });
            setIsListening(true);
        }
    };

    const handleOverlayClick = () => {
        if (isListening) {
            SpeechRecognition.stopListening();
            setIsListening(false);
            setShowPaperSelection(false);
        }
    };

    const handlePaperToggle = (paperId) => {
        setSelectedPaperIds(prev => 
            prev.includes(paperId)
                ? prev.filter(id => id !== paperId)
                : [...prev, paperId]
        );
    };

    if (!browserSupportsSpeechRecognition) {
        return null;
    }

    return (
        <div className="voice-search-container">
            <button 
                className={`voice-search-button ${isListening ? 'listening' : ''}`}
                onClick={handleToggleListening}
                title="Voice commands"
            >
                <Mic size={18} />
            </button>
            {isListening && (
                <div className="voice-overlay" onClick={handleOverlayClick}>
                    <div className="voice-feedback" onClick={e => e.stopPropagation()}>
                        {showPaperSelection ? (
                            <div className="voice-paper-selection">
                                <div className="voice-search-header">
                                    <h3>Select papers to search</h3>
                                    <div className="voice-search-query">
                                        <Search size={16} />
                                        <span>{searchQuery || "Waiting for query..."}</span>
                                    </div>
                                </div>
                                
                                <div className="voice-search-papers">
                                    {papers.map(paper => (
                                        <div
                                            key={paper.id}
                                            className={`voice-search-paper ${selectedPaperIds.includes(paper.id) ? 'selected' : ''}`}
                                            onClick={() => handlePaperToggle(paper.id)}
                                        >
                                            <div className="voice-paper-checkbox">
                                                {selectedPaperIds.includes(paper.id) && (
                                                    <Check size={14} color="white" />
                                                )}
                                            </div>
                                            <span>{paper.title || 'Untitled Paper'}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="voice-search-actions">
                                    <span className="voice-selected-count">
                                        {selectedPaperIds.length} papers selected
                                    </span>
                                    <div className="voice-action-buttons">
                                        <button className="voice-cancel-btn" onClick={handleCancelSearch}>
                                            <X size={14} />
                                            Cancel
                                        </button>
                                        <button 
                                            className="voice-search-btn"
                                            disabled={!searchQuery || selectedPaperIds.length === 0}
                                            onClick={handleExecuteSearch}
                                        >
                                            <Search size={14} />
                                            Search
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="voice-commands-help">
                                    Try: "select all papers", "go" or "search now" to execute
                                </div>
                            </div>
                        ) : (
                            <>
                                {transcript || "Listening..."}
                                <div className="voice-commands-help">
                                    Try: "search [your query]" or ask a question about the highlighted text
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoiceSearch; 
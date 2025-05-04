import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';
import { Pencil, Trash2, Pin, Video, ExternalLink, Clock, Eye } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Routes, Route, useLocation } from 'react-router-dom';
import ResetPassword from './ResetPassword';
import SearchPalette from './components/SearchPalette';
import { processAndStorePdf, getPaperContent } from './utils/searchUtils';
import SearchHistory from './components/SearchHistory';
import VoiceSearch from './components/VoiceSearch';
import WorkspacePalette from './components/WorkspacePalette';
import './styles/VoiceSearch.css';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import './App.css';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent';
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

function App() {
    const [papers, setPapers] = useState([]);
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [notes, setNotes] = useState({});
    const [userMessage, setUserMessage] = useState('');
    const [isGeminiLoading, setIsGeminiLoading] = useState(false);
    const [highlightedText, setHighlightedText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingNote, setEditingNote] = useState(null);
    const [videoSuggestions, setVideoSuggestions] = useState({});
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [isLoadingPapers, setIsLoadingPapers] = useState(false);
    const fileInputRef = React.useRef(null);
    const [session, setSession] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedPaperIds, setSelectedPaperIds] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [query, setQuery] = useState('');
    const searchPaletteRef = useRef(null);
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
    const [currentWorkspace, setCurrentWorkspace] = useState(null);
    const workspacePaletteRef = useRef(null);
    const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);
    const location = useLocation();

    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    const highlightPluginInstance = highlightPlugin({
        renderHighlightTarget: (props) => {
            const viewerContainer = document.querySelector('.rpv-core__viewer');
            const viewerRect = viewerContainer.getBoundingClientRect();
            const selectionRect = props.selectionRegion;

            // Store the highlighted text
            setHighlightedText(props.selectedText);
            
            const left = (selectionRect.left * viewerRect.width) / 100;
            const top = (selectionRect.top * viewerRect.height) / 100;
            const highlightWidth = (selectionRect.width * viewerRect.width) / 100;
            const popupLeft = left + (highlightWidth / 2);
            let popupTop = top + ((selectionRect.height * viewerRect.height) / 100) + 10;
            
            if (popupTop + 220 > viewerRect.height) {
                popupTop = top - 220 - 10;
            }

            return (
                <div
                    className="highlight-popup-container"
                    style={{
                        position: 'absolute',
                        left: `${(popupLeft / viewerRect.width) * 100}%`,
                        top: `${(popupTop / viewerRect.height) * 100}%`,
                    }}
                >
                    <div 
                        className="highlight-popup"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <textarea
                            className="highlight-textarea"
                            placeholder="What would you like to ask about this text?"
                            value={userMessage}
                            onChange={(e) => setUserMessage(e.target.value)}
                            rows="4"
                            autoFocus
                        />
                        <div className="highlight-popup-actions">
                            <button
                                className="highlight-button"
                                onClick={handleAskGemini}
                                disabled={isGeminiLoading || !userMessage.trim()}
                            >
                                {isGeminiLoading ? (
                                    <>
                                        <span className="loading-spinner"></span>
                                        Processing...
                                    </>
                                ) : (
                                    'Submit Query'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            );
        },
    });

    const formatDuration = (duration) => {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = (match[1] || '').replace('H', '');
        const minutes = (match[2] || '').replace('M', '');
        const seconds = (match[3] || '').replace('S', '');
        
        let result = '';
        if (hours) result += `${hours}:`;
        result += `${minutes.padStart(2, '0')}:`;
        result += seconds.padStart(2, '0');
        return result;
    };

    const handleDeleteVideoSuggestion = async (suggestionId) => {
        if (!session?.user || !window.confirm('Are you sure you want to delete this video suggestion?')) return;

        try {
            // Delete from Supabase
            const { error } = await supabase
                .from('video_suggestions')
                .delete()
                .eq('id', suggestionId)
                .eq('user_id', session.user.id);

            if (error) throw error;

            // Update local state
            setVideoSuggestions(prevSuggestions => ({
                ...prevSuggestions,
                [selectedPaper.id]: prevSuggestions[selectedPaper.id].filter(
                    suggestion => suggestion.id !== suggestionId
                )
            }));

        } catch (error) {
            console.error('Error deleting video suggestion:', error);
            alert('Error deleting video suggestion');
        }
    };

    // Add function to pin video suggestion
    const handleToggleVideoPin = async (suggestionId) => {
        if (!session?.user) return;

        try {
            const suggestion = videoSuggestions[selectedPaper.id].find(s => s.id === suggestionId);
            const newPinnedState = !suggestion.isPinned;

            // Update in Supabase
            const { error } = await supabase
                .from('video_suggestions')
                .update({ is_pinned: newPinnedState })
                .eq('id', suggestionId)
                .eq('user_id', session.user.id);

            if (error) throw error;

            // Update local state
            setVideoSuggestions(prevSuggestions => ({
                ...prevSuggestions,
                [selectedPaper.id]: prevSuggestions[selectedPaper.id].map(suggestion =>
                    suggestion.id === suggestionId
                        ? { ...suggestion, isPinned: newPinnedState }
                        : suggestion
                )
            }));

        } catch (error) {
            console.error('Error updating video pin status:', error);
            alert('Error updating video pin status');
        }
    };

    const handleGetVideoSuggestions = async (text) => {
        if (!session?.user || !selectedPaper) return;
        
        setIsVideoLoading(true);
        try {
            // Search YouTube
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(text)}&type=video&maxResults=3&key=${YOUTUBE_API_KEY}`
            );
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                console.log('No videos found');
                return;
            }
            
            // Get video details (duration and view count)
            const videoIds = data.items.map(item => item.id.videoId).join(',');
            const detailsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
            );
            const detailsData = await detailsResponse.json();

            // Create suggestions with unique IDs and workspace context
            const newSuggestions = data.items.map((item, index) => {
                const details = detailsData.items[index];
                return {
                    id: crypto.randomUUID(),
                    paper_id: selectedPaper.id,
                    user_id: session.user.id,
                    workspace_id: currentWorkspace?.id || null,
                    video_id: item.id.videoId,
                    title: item.snippet.title,
                    duration: formatDuration(details.contentDetails.duration),
                    view_count: parseInt(details.statistics.viewCount).toLocaleString(),
                    timestamp: new Date().toISOString(),
                    is_pinned: false
                };
            });

            console.log('Inserting video suggestions:', newSuggestions);

            // Insert into database
            const { error } = await supabase
                .from('video_suggestions')
                .insert(newSuggestions);

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            // Update local state
            setVideoSuggestions(prev => ({
                ...prev,
                [selectedPaper.id]: [
                    ...(prev[selectedPaper.id] || []),
                    ...newSuggestions
                ]
            }));

            console.log('Video suggestions updated successfully');

        } catch (error) {
            console.error('Error getting video suggestions:', error);
        } finally {
            setIsVideoLoading(false);
        }
    };

    const renderVideoSuggestion = (suggestion) => (
        <div className="video-suggestion">
            <div className="video-title">{suggestion.title}</div>
            <div className="video-meta">
                <span className="video-meta-item">
                    <Clock size={14} />
                    {suggestion.duration}
                </span>
                <span className="video-meta-item">
                    <Eye size={14} />
                    {suggestion.view_count} views
                </span>
            </div>
            <div className="video-actions">
                <a 
                    href={`https://www.youtube.com/watch?v=${suggestion.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="video-link"
                >
                    <ExternalLink size={14} />
                    Watch on YouTube
                </a>
                <button 
                    className="video-action-btn"
                    onClick={() => handleToggleVideoPin(suggestion.id)}
                    title={suggestion.isPinned ? "Unpin suggestion" : "Pin suggestion"}
                >
                    <Pin size={14} />
                </button>
                <button
                    className="video-action-btn"
                    onClick={() => handleDeleteVideoSuggestion(suggestion.id)}
                    title="Delete suggestion"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
  
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        };
    
        getSession();
    
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
    
        return () => subscription.unsubscribe();
    }, []);

    const handleEditNote = (noteId) => {
        setEditingNote(noteId);
    };

    const handleSaveEdit = (noteId, newResponse) => {
        setNotes(prevNotes => ({
            ...prevNotes,
            [selectedPaper.id]: prevNotes[selectedPaper.id].map(note =>
                note.id === noteId
                    ? { ...note, response: newResponse }
                    : note
            )
        }));
        setEditingNote(null);
    };

    const handleDeleteNote = async (noteId) => {
        if (!session?.user || !window.confirm('Are you sure you want to delete this note?')) return;

        try {
            // Delete from Supabase
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', noteId)
                .eq('user_id', session.user.id);

            if (error) throw error;

            // Update local state
            setNotes(prevNotes => ({
                ...prevNotes,
                [selectedPaper.id]: prevNotes[selectedPaper.id].filter(note => note.id !== noteId)
            }));

        } catch (error) {
            console.error('Error deleting note:', error);
            alert('Error deleting note');
        }
    };

    const handleTogglePin = async (noteId) => {
        if (!session?.user) return;

        try {
            const note = notes[selectedPaper.id].find(n => n.id === noteId);
            const newPinnedState = !note.isPinned;

            // Update in Supabase
            const { error } = await supabase
                .from('notes')
                .update({ is_pinned: newPinnedState })
                .eq('id', noteId)
                .eq('user_id', session.user.id);

            if (error) throw error;

            // Update local state
            setNotes(prevNotes => ({
                ...prevNotes,
                [selectedPaper.id]: prevNotes[selectedPaper.id].map(note =>
                    note.id === noteId
                        ? { ...note, isPinned: newPinnedState }
                        : note
                )
            }));

        } catch (error) {
            console.error('Error updating pin status:', error);
            alert('Error updating pin status');
        }
    };

    const renderNote = (note) => (
        <div key={note.id} className={`note-item ${note.isPinned ? 'pinned' : ''}`}>
            <div className="note-actions">
                <button
                    className={`note-action-btn ${note.isPinned ? 'pinned' : ''}`}
                    onClick={() => handleTogglePin(note.id)}
                    title={note.isPinned ? "Unpin note" : "Pin note"}
                >
                    <Pin size={14} />
                </button>
                <button
                    className="note-action-btn"
                    onClick={() => handleEditNote(note.id)}
                    title="Edit note"
                >
                    <Pencil size={14} />
                </button>
                <button
                    className="note-action-btn"
                    onClick={() => handleDeleteNote(note.id)}
                    title="Delete note"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="note-page">Page {note.page}</div>
            <div className="highlight-text">{note.highlight}</div>
            <div className="note-question">Q: {note.message}</div>
            {editingNote === note.id ? (
                <div className="note-edit">
                    <textarea
                        defaultValue={note.response}
                        className="highlight-textarea"
                        rows="4"
                        autoFocus
                    />
                    <div className="highlight-popup-actions">
                        <button className="highlight-button" onClick={() => setEditingNote(null)} style={{ marginRight: '8px' }}>Cancel</button>
                        <button 
                            className="highlight-button" 
                            onClick={(e) => {
                                const textarea = e.target.closest('.note-edit').querySelector('textarea');
                                handleSaveEdit(note.id, textarea.value);
                            }}
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <div className="ai-response">A: {note.response}</div>
            )}
            <div className="note-timestamp">{new Date(note.timestamp).toLocaleString()}</div>
        </div>
    );

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!session?.user) {
            alert('Please sign in to upload files');
            return;
        }
        
        if (file) {
            try {
                // Create local URL for immediate viewing
                const localUrl = URL.createObjectURL(file);

                // Upload file to Supabase Storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${session.user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('pdfs')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Storage upload error:', uploadError);
                    throw uploadError;
                }

                // Save paper metadata to database
                const { data: paper, error: dbError } = await supabase
                    .from('papers')
                    .insert({
                        user_id: session.user.id,
                        title: file.name,
                        file_path: filePath,
                    })
                    .select()
                    .single();

                if (dbError) {
                    console.error('Database insert error:', dbError);
                    throw dbError;
                }

                try {
                    // Process the PDF for search functionality
                    await processAndStorePdf(paper.id, localUrl);
                } catch (processError) {
                    console.error('PDF processing error:', processError);
                    // Continue with the upload even if processing fails
                    // We can add a retry mechanism later
                }

                // Add to local state using local URL
                const newPaper = {
                    id: paper.id,
                    title: file.name,
                    file: localUrl,
                    dateAdded: new Date(paper.date_added).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                };

                setPapers([...papers, newPaper]);
                fileInputRef.current.value = '';

                // If in a workspace, add the paper to the workspace
                if (currentWorkspace) {
                    const { error: workspacePaperError } = await supabase
                        .from('workspace_papers')
                        .insert({
                            workspace_id: currentWorkspace.id,
                            paper_id: paper.id,
                            added_by: session.user.id
                        });

                    if (workspacePaperError) throw workspacePaperError;
                }

                // Reload papers based on context
                if (currentWorkspace) {
                    await loadWorkspacePapers(currentWorkspace.id);
                } else {
                    await loadUserPapers();
                }

            } catch (error) {
                console.error('Error uploading file:', error);
                alert(`Error uploading file: ${error.message || 'Unknown error'}`);
            }
        }
    };

    const handleSelectPaper = (paper) => {
        setSelectedPaper(paper);
        loadNotesAndVideos(paper.id);
    };

    const handleDelete = async (paperId) => {
        if (!window.confirm('Are you sure you want to delete this paper?')) return;

        try {
            if (currentWorkspace) {
                // If in a workspace, just remove the paper from the workspace
                const { error: workspacePaperError } = await supabase
                    .from('workspace_papers')
                    .delete()
                    .eq('workspace_id', currentWorkspace.id)
                    .eq('paper_id', paperId);

                if (workspacePaperError) throw workspacePaperError;

                // Clear selected paper if it was the one deleted
                if (selectedPaper?.id === paperId) {
                    setSelectedPaper(null);
                }

                // Update local state
                setPapers(papers.filter(p => p.id !== paperId));
            } else {
                // For personal papers, delete everything
                // First get the paper details
                const { data: paper, error: paperFetchError } = await supabase
                    .from('papers')
                    .select('file_path')
                    .eq('id', paperId)
                    .single();

                if (paperFetchError) throw paperFetchError;

                // Delete all associated data
                await Promise.all([
                    // Delete notes
                    supabase.from('notes').delete().eq('paper_id', paperId),
                    // Delete video suggestions
                    supabase.from('video_suggestions').delete().eq('paper_id', paperId),
                    // Delete search history entries
                    supabase.from('search_history').delete().filter('paper_ids', 'cs', `{${paperId}}`),
                    // Delete workspace_papers entries
                    supabase.from('workspace_papers').delete().eq('paper_id', paperId),
                ]);

                // Delete the paper record
                const { error: paperError } = await supabase
                    .from('papers')
                    .delete()
                    .eq('id', paperId);

                if (paperError) throw paperError;

                // Delete the file from storage if it exists
                if (paper?.file_path) {
                    const { error: storageError } = await supabase.storage
                        .from('pdfs')
                        .remove([paper.file_path]);

                    if (storageError) throw storageError;
                }

                // Clear selected paper if it was the one deleted
                if (selectedPaper?.id === paperId) {
                    setSelectedPaper(null);
                }

                // Update local state
                setPapers(papers.filter(p => p.id !== paperId));
                setSearchHistory(searchHistory.filter(h => !h.paper_ids.includes(paperId)));
                setNotes(prevNotes => {
                    const newNotes = { ...prevNotes };
                    delete newNotes[paperId];
                    return newNotes;
                });
                setVideoSuggestions(prevSuggestions => {
                    const newSuggestions = { ...prevSuggestions };
                    delete newSuggestions[paperId];
                    return newSuggestions;
                });
            }
        } catch (error) {
            console.error('Error deleting paper:', error);
            alert('Error deleting paper: ' + error.message);
        }
    };

    const handleAskGemini = async () => {
        if (isGeminiLoading || !userMessage.trim() || !highlightedText || !session?.user) return;

        setIsGeminiLoading(true);
        try {
            const prompt = `Context: The following is a highlighted text from an academic paper:
"${highlightedText}"

User's Question: ${userMessage}

Please provide a clear and concise response, focusing on the specific question while considering the context of the highlighted text.`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Error:", errorData);
                throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid response format from Gemini API');
            }

            const geminiResponse = data.candidates[0].content.parts[0].text;

            // Create new note with workspace context if applicable
            const newNote = {
                id: crypto.randomUUID(),
                user_id: session.user.id,
                paper_id: selectedPaper.id,
                workspace_id: currentWorkspace?.id || null,
                page: currentPage,
                highlight: highlightedText,
                message: userMessage,
                response: geminiResponse,
                is_pinned: false,
                timestamp: new Date().toISOString()
            };

            // Save note to Supabase
            const { error: noteError } = await supabase
                .from('notes')
                .insert(newNote);

            if (noteError) throw noteError;

            // Update local state
            setNotes(prevNotes => ({
                ...prevNotes,
                [selectedPaper.id]: [...(prevNotes[selectedPaper.id] || []), newNote]
            }));

            // Generate and save video suggestions with workspace context
            await handleGetVideoSuggestions(highlightedText);

            setUserMessage('');

        } catch (error) {
            console.error("Error:", error);
            alert('Failed to save note');
        } finally {
            setIsGeminiLoading(false);
        }
    };

    const handleSignUp = async () => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
    
        if (error) {
            alert(error.message);
        } else {
            console.log("Sign-up successful:", data);
            alert('Check your email for confirmation!');
        }
    };
    
    const handleSignIn = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
    
        if (error) {
            alert(error.message);
        } else {
            console.log("Sign-in successful:", data);
            alert('Logged in successfully!');
        }
    };    
    
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setSession(null);

        setEmail('');
        setPassword('');
    };
    
    const handleForgotPassword = async () => {
        if (!email) {
            alert('Please enter your email first!');
            return;
        }
        const redirectBase = process.env.REACT_APP_REDIRECT_URL || window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${redirectBase}/reset-password`
        });
        // Immediately sign out to clear the temp session
        await supabase.auth.signOut();
        if (error) {
            alert(error.message);
        } else {
            alert('Password reset email sent! Check your inbox.');
        }
    };    

    // Add cleanup for text selection
    useEffect(() => {
        const clearSelection = () => {
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
        };

        // Clear selection when component unmounts or paper changes
        return () => {
            clearSelection();
            setHighlightedText('');
            setUserMessage('');
        };
    }, [selectedPaper]);

    const loadNotesAndVideos = async (paperId) => {
        if (!session?.user) return;

        try {
            // Load notes with proper workspace handling
            let notesQuery = supabase
                .from('notes')
                .select('*')
                .eq('paper_id', paperId);
            
            if (currentWorkspace) {
                // In workspace context, get all notes from the workspace
                notesQuery = notesQuery.eq('workspace_id', currentWorkspace.id);
            } else {
                // In personal context, only get user's personal notes
                notesQuery = notesQuery
                    .eq('user_id', session.user.id)
                    .is('workspace_id', null);
            }

            const { data: notesData, error: notesError } = await notesQuery;
            if (notesError) throw notesError;

            // Load video suggestions with similar workspace handling
            let videosQuery = supabase
                .from('video_suggestions')
                .select('*')
                .eq('paper_id', paperId)
                .order('timestamp', { ascending: false }); // Show newest first

            if (currentWorkspace) {
                videosQuery = videosQuery.eq('workspace_id', currentWorkspace.id);
            } else {
                videosQuery = videosQuery
                    .eq('user_id', session.user.id)
                    .is('workspace_id', null);
            }

            const { data: videosData, error: videosError } = await videosQuery;
            if (videosError) throw videosError;

            // Remove duplicates based on video_id, keeping the most recent one
            const uniqueVideos = videosData.reduce((acc, current) => {
                const x = acc.find(item => item.video_id === current.video_id);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    return acc;
                }
            }, []);

            setNotes(prevNotes => ({
                ...prevNotes,
                [paperId]: notesData
            }));

            setVideoSuggestions(prevVideos => ({
                ...prevVideos,
                [paperId]: uniqueVideos
            }));

        } catch (error) {
            console.error('Error loading notes and videos:', error);
            alert('Error loading notes and videos');
        }
    };

    // Add this effect to handle the keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey)) {
                if (e.key === 'k') {
                    e.preventDefault();
                    setIsSearchOpen(true);
                } else if (e.key === 'i') {
                    e.preventDefault();
                    setIsWorkspaceOpen(true);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Add this function to load search history
    const loadSearchHistory = useCallback(async () => {
        if (!session?.user) return;
        
        const { data, error } = await supabase
            .from('search_history')
            .select('*')
            .eq('user_id', session.user.id)
            .order('timestamp', { ascending: false });
        
        if (error) {
            console.error('Error loading search history:', error);
            return;
        }
        
        setSearchHistory(data);
    }, [session?.user]);

    // Add useEffect to load search history when component mounts
    useEffect(() => {
        if (session?.user) {
            loadSearchHistory();
        }
    }, [session, loadSearchHistory]);

    // Modify handleSearch to include pagination and token handling
    const handleSearch = async (query, paperIds) => {
        if (!query || !paperIds?.length) return;

        setIsGeminiLoading(true);
        try {
            // Get content for selected papers
            const contents = await Promise.all(
                paperIds.map(id => getPaperContent(id))
            );

            const prompt = `Search Query: "${query}"

Papers to search:
${contents.map((content, i) => `Paper ${i + 1}: ${content}`).join('\n\n')}

Please provide relevant excerpts and explanations from these papers that answer or relate to the search query. Format your response clearly, citing which paper each piece of information comes from.`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) throw new Error('Failed to get response from Gemini');
            
            const data = await response.json();
            const searchResult = data.candidates[0].content.parts[0].text;

            // Save to search history
            const { error } = await supabase
                .from('search_history')
                .insert({
                    user_id: session.user.id,
                    query,
                    paper_ids: paperIds,
                    response: searchResult,
                    timestamp: new Date().toISOString()
                });

            if (error) throw error;

            // Update local state
            loadSearchHistory();

            // Update the search palette with results
            if (searchPaletteRef.current) {
                searchPaletteRef.current.setSearchResult(searchResult);
            }

            return searchResult;

        } catch (error) {
            console.error('Search error:', error);
            alert('Error performing search');
        } finally {
            setIsGeminiLoading(false);
        }
    };

    // Update handleSelectHistory to set the search result directly
    const handleSelectHistory = async (item) => {
        // First ensure we have all the papers loaded
        const missingPaperIds = item.paper_ids.filter(id => !papers.find(p => p.id === id));
        
        if (missingPaperIds.length > 0) {
            try {
                // Fetch missing papers from Supabase
                const { data: missingPapers, error } = await supabase
                    .from('papers')
                    .select('*')
                    .in('id', missingPaperIds);
                    
                if (error) {
                    console.error('Error fetching missing papers:', error);
                    alert('Error loading papers from history');
                    return;
                }

                // Transform papers to include file URLs
                const transformedPapers = await Promise.all(missingPapers.map(async paper => {
                    try {
                        const { data: fileData, error: fileError } = await supabase.storage
                            .from('pdfs')
                            .download(paper.file_path);

                        if (fileError) throw fileError;

                        const blobUrl = URL.createObjectURL(fileData);
                        return {
                            ...paper,
                            file: blobUrl,
                            dateAdded: new Date(paper.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })
                        };
                    } catch (fileError) {
                        console.error('Error processing file for paper:', paper.id, fileError);
                        return null;
                    }
                }));

                // Filter out any papers that failed to load
                const validPapers = transformedPapers.filter(Boolean);
                
                // Add missing papers to the papers array
                setPapers(prevPapers => [...prevPapers, ...validPapers]);
                
                // Wait a tick to ensure papers state is updated
                await new Promise(resolve => setTimeout(resolve, 0));
            } catch (error) {
                console.error('Error loading papers:', error);
                alert('Error loading papers from history');
                return;
            }
        }

        setQuery(item.query);
        setSelectedPaperIds(item.paper_ids);
        setIsSearchOpen(true);
        
        // Pass the stored response to SearchPalette by setting its state
        if (searchPaletteRef.current) {
            searchPaletteRef.current.setSearchResult(item.response);
        }
    };

    const handleDeleteHistory = async (id) => {
        try {
            const { error } = await supabase
                .from('search_history')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            // Refresh history
            loadSearchHistory();
        } catch (error) {
            console.error('Error deleting history:', error);
        }
    };

    const handleToggleFavorite = async (id) => {
        try {
            const item = searchHistory.find(h => h.id === id);
            const { error } = await supabase
                .from('search_history')
                .update({ favorite: !item.favorite })
                .eq('id', id);
            
            if (error) throw error;
            
            // Refresh history
            loadSearchHistory();
        } catch (error) {
            console.error('Error updating favorite:', error);
        }
    };

    const handleVoiceInput = async ({ type, query, text, paperIds }) => {
        switch (type) {
            case 'search':
                setQuery(query);
                if (paperIds) {
                    setSelectedPaperIds(paperIds);
                }
                
                setIsSearchOpen(true);
                
                // Wait for search to complete and show results
                const papersToSearch = paperIds || papers.map(p => p.id);
                const searchResult = await handleSearch(query, papersToSearch);
                
                // Ensure search palette is open and showing results
                if (searchResult && searchPaletteRef.current) {
                    searchPaletteRef.current.setSearchResult(searchResult);
                }
                break;
            
            case 'question':
                if (selectedPaper && highlightedText) {
                    setUserMessage(text);
                    // Execute the question immediately
                    handleAskGemini();
                }
                break;
            
            default:
                break;
        }
    };

    // Update loadWorkspacePapers function
    const loadWorkspacePapers = async (workspaceId) => {
        setIsLoadingPapers(true);
        try {
            const { data, error } = await supabase
                .from('workspace_papers')
                .select(`
                    paper_id,
                    papers:paper_id (
                        id,
                        title,
                        file_path,
                        user_id,
                        date_added
                    )
                `)
                .eq('workspace_id', workspaceId);

            if (error) throw error;
            
            // Transform the papers to include the file URL
            const transformedPapers = await Promise.all(data.map(async wp => {
                const { data: fileData } = await supabase.storage
                    .from('pdfs')
                    .download(wp.papers.file_path);
                
                const blobUrl = URL.createObjectURL(fileData);
                    
                return {
                    ...wp.papers,
                    file: blobUrl,
                    dateAdded: new Date(wp.papers.date_added).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })
                };
            }));
            
            setPapers(transformedPapers);
        } catch (error) {
            console.error('Error loading workspace papers:', error);
        } finally {
            setIsLoadingPapers(false);
        }
    };

    // Wrap loadUserPapers in useCallback
    const loadUserPapers = useCallback(async () => {
        if (!session?.user) return;
        setIsLoadingPapers(true);
        try {
            // First get all workspace papers to exclude
            const { data: workspacePapers, error: workspaceError } = await supabase
                .from('workspace_papers')
                .select('paper_id');

            if (workspaceError) {
                console.error('Error fetching workspace papers:', workspaceError);
                throw workspaceError;
            }

            // Create a Set of paper IDs that are in workspaces
            const workspacePaperIds = new Set(workspacePapers?.map(wp => wp.paper_id) || []);

            // Get user's papers that are NOT in any workspace
            const { data: userPapers, error: papersError } = await supabase
                .from('papers')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (papersError) {
                console.error('Error fetching user papers:', papersError);
                throw papersError;
            }

            // Filter out papers that exist in any workspace
            const personalPapersData = userPapers.filter(paper => !workspacePaperIds.has(paper.id));

            // Transform remaining papers to include file URLs
            const transformedPapers = await Promise.all(personalPapersData.map(async paper => {
                try {
                    const { data: fileData, error: fileError } = await supabase.storage
                        .from('pdfs')
                        .download(paper.file_path);

                    if (fileError) {
                        console.error('Error downloading file:', fileError);
                        throw fileError;
                    }

                    const blobUrl = URL.createObjectURL(fileData);
                    return {
                        ...paper,
                        file: blobUrl,
                        dateAdded: new Date(paper.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })
                    };
                } catch (fileError) {
                    console.error('Error processing file for paper:', paper.id, fileError);
                    return null;
                }
            }));

            // Filter out any papers that failed to load and update both states
            const validPapers = transformedPapers.filter(Boolean);
            setPapers(validPapers);

        } catch (error) {
            console.error('Error loading user papers:', error);
            alert('Error loading papers');
        } finally {
            setIsLoadingPapers(false);
        }
    }, [session]);

    // Wrap loadPapers in useCallback
    const loadPapers = useCallback(async () => {
        if (!session?.user) return;
        setIsLoadingPapers(true);

        try {
            if (currentWorkspace) {
                // In workspace context, get papers from the workspace
                const { data: workspacePapers, error: wpError } = await supabase
                    .from('workspace_papers')
                    .select('paper_id')
                    .eq('workspace_id', currentWorkspace.id);

                if (wpError) {
                    console.error('Error fetching workspace papers:', wpError);
                    throw wpError;
                }

                if (!workspacePapers?.length) {
                    setPapers([]);
                    return;
                }

                // Get the actual paper details
                const { data: papers, error: papersError } = await supabase
                    .from('papers')
                    .select('*')
                    .in('id', workspacePapers.map(wp => wp.paper_id))
                    .order('created_at', { ascending: false });

                if (papersError) {
                    console.error('Error fetching paper details:', papersError);
                    throw papersError;
                }

                // Transform papers to include file URLs
                const transformedPapers = await Promise.all(papers.map(async paper => {
                    try {
                        const { data: fileData, error: fileError } = await supabase.storage
                            .from('pdfs')
                            .download(paper.file_path);

                        if (fileError) {
                            console.error('Error downloading file:', fileError);
                            throw fileError;
                        }

                        const blobUrl = URL.createObjectURL(fileData);
                        return {
                            ...paper,
                            file: blobUrl,
                            dateAdded: new Date(paper.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })
                        };
                    } catch (fileError) {
                        console.error('Error processing file for paper:', paper.id, fileError);
                        return null;
                    }
                }));

                // Filter out any papers that failed to load
                setPapers(transformedPapers.filter(Boolean));
            } else {
                // In personal context, get user's papers
                const { data: papers, error: papersError } = await supabase
                    .from('papers')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (papersError) {
                    console.error('Error fetching personal papers:', papersError);
                    throw papersError;
                }

                // Transform papers to include file URLs
                const transformedPapers = await Promise.all(papers.map(async paper => {
                    try {
                        const { data: fileData, error: fileError } = await supabase.storage
                            .from('pdfs')
                            .download(paper.file_path);

                        if (fileError) {
                            console.error('Error downloading file:', fileError);
                            throw fileError;
                        }

                        const blobUrl = URL.createObjectURL(fileData);
                        return {
                            ...paper,
                            file: blobUrl,
                            dateAdded: new Date(paper.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })
                        };
                    } catch (fileError) {
                        console.error('Error processing file for paper:', paper.id, fileError);
                        return null;
                    }
                }));

                // Filter out any papers that failed to load
                setPapers(transformedPapers.filter(Boolean));
            }
        } catch (error) {
            console.error('Detailed error loading papers:', error);
            alert('Error loading papers. Please check console for details.');
        } finally {
            setIsLoadingPapers(false);
        }
    }, [session, currentWorkspace]);

    // Add effect to load initial papers
    useEffect(() => {
        const loadInitialPapers = async () => {
            if (session?.user) {
                const storedWorkspace = localStorage.getItem('currentWorkspace');
                if (storedWorkspace) {
                    const workspace = JSON.parse(storedWorkspace);
                    setCurrentWorkspace(workspace);
                    await loadWorkspacePapers(workspace.id);
                } else {
                    await loadUserPapers();
                }
            }
        };

        loadInitialPapers();
    }, [session, loadUserPapers]);

    // Add effect to load papers when workspace context changes
    useEffect(() => {
        if (session?.user) {
            loadPapers();
        }
    }, [session, currentWorkspace, loadPapers]);

    // Add subscription for paper deletions
    useEffect(() => {
        if (!session?.user) return;

        // Subscribe to workspace_papers deletions
        const workspacePapersSubscription = supabase
            .channel('workspace_papers_changes')
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'workspace_papers'
            }, (payload) => {
                // First clear all states if the deleted paper was being viewed
                if (selectedPaper?.id === payload.old.paper_id) {
                    setSelectedPaper(null);
                    setNotes(prev => {
                        const newNotes = { ...prev };
                        delete newNotes[payload.old.paper_id];
                        return newNotes;
                    });
                    setVideoSuggestions(prev => {
                        const newSuggestions = { ...prev };
                        delete newSuggestions[payload.old.paper_id];
                        return newSuggestions;
                    });
                    setHighlightedText('');
                    setUserMessage('');
                }
                // Then update papers list
                setPapers(prevPapers => prevPapers.filter(p => p.id !== payload.old.paper_id));
            })
            .subscribe();

        // Subscribe to papers deletions
        const papersSubscription = supabase
            .channel('papers_changes')
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'papers'
            }, (payload) => {
                // First clear all states if the deleted paper was being viewed
                if (selectedPaper?.id === payload.old.id) {
                    setSelectedPaper(null);
                    setNotes(prev => {
                        const newNotes = { ...prev };
                        delete newNotes[payload.old.id];
                        return newNotes;
                    });
                    setVideoSuggestions(prev => {
                        const newSuggestions = { ...prev };
                        delete newSuggestions[payload.old.id];
                        return newSuggestions;
                    });
                    setHighlightedText('');
                    setUserMessage('');
                }
                // Then update papers list
                setPapers(prevPapers => prevPapers.filter(p => p.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            workspacePapersSubscription.unsubscribe();
            papersSubscription.unsubscribe();
        };
    }, [session, selectedPaper]);

    // Add this effect to ensure selectedPaper is always valid
    useEffect(() => {
        // If the selectedPaper doesn't exist in the papers array, clear it
        if (selectedPaper && papers.length > 0 && !papers.some(p => p.id === selectedPaper.id)) {
            setSelectedPaper(null);
            setHighlightedText('');
            setUserMessage('');
        }
    }, [papers, selectedPaper]);

    // Add this function near other handler functions
    const handleWorkspaceChange = async (workspace) => {
        setIsLoadingPapers(true);
        try {
            if (workspace) {
                // Switching to a workspace
                setCurrentWorkspace(workspace);
                localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
                await loadWorkspacePapers(workspace.id);
            } else {
                // Exiting workspace
                setCurrentWorkspace(null);
                localStorage.removeItem('currentWorkspace');
                // Load and set personal papers
                await loadUserPapers();
            }
            // Clear selected paper when switching contexts
            setSelectedPaper(null);
        } catch (error) {
            console.error('Error changing workspace:', error);
            alert('Error changing workspace context');
        } finally {
            setIsLoadingPapers(false);
        }
    };

    return (
        <div className="App">
            <Routes>
                {/* Reset Password Route */}
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Main App Route */}
                <Route
                    path="/"
                    element={
                        <>
                            <header className="App-header">
                                <h1>LabGPT</h1>
                                <div className="header-actions">
                                    <span className="header-subtitle">Your AI-powered research assistant</span>
                                    {currentWorkspace && (
                                        <div className="current-workspace">
                                            <span>Workspace: {currentWorkspace.name}</span>
                                        </div>
                                    )}
                                    {session && (
                                        <button
                                            className="search-history-toggle-btn"
                                            title="Toggle search history"
                                            onClick={() => setIsSearchHistoryOpen((open) => !open)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                                        >
                                            <Clock size={22} color="#00A3A3" />
                                        </button>
                                    )}
                                </div>
                            </header>

                            {!session ? (
                                <div className="auth-container">
                                    <h2>Welcome 👋</h2>
                                    <p style={{ color: "#888", fontSize: "1rem", textAlign: "center", marginBottom: "10px" }}>
                                        Sign in or create an account to start using LabGPT.
                                    </p>

                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />

                                    <button onClick={handleSignIn} className="sign-in-btn">Sign In</button>

                                    <button onClick={handleForgotPassword} className="forgot-password-btn">
                                        Forgot your password?
                                    </button>

                                    <div className="auth-divider">or</div>

                                    <button onClick={handleSignUp} className='sign-up-btn'>
                                        Sign Up
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button onClick={handleSignOut} className="logout-btn">Sign Out</button>
                        
                                    <div className="upload-container">
                                        <div className="upload-section">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileUpload}
                                                className="upload-input"
                                                ref={fileInputRef}
                                                id="file-upload"
                                            />
                                            <label htmlFor="file-upload" className="upload-label">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                                Upload PDF
                                            </label>
                                        </div>
                                    </div>
                            
                                    <div className="papers-grid">
                                        {isLoadingPapers ? (
                                            <div className="loading-papers">
                                                <span className="loading-spinner"></span>
                                                <span>Loading papers...</span>
                                            </div>
                                        ) : papers.length > 0 ? (
                                            papers.map((paper) => (
                                                <div
                                                    key={paper.id}
                                                    className="paper-card"
                                                    onClick={() => handleSelectPaper(paper)}
                                                >
                                                    <h3>{paper.title}</h3>
                                                    <p className="date-added">{paper.dateAdded}</p>
                                                    <button
                                                        className="delete-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(paper.id);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-papers">
                                                <p>No papers found. Upload a PDF to get started!</p>
                                            </div>
                                        )}
                                    </div>
                            
                                    {selectedPaper && papers.length > 0 && (
                                        <div className="paper-viewer-container">
                                            <div className="pdf-container">
                                                <div className="border-accent">
                                                    <div className="border-line"></div>
                                                    <div className="border-line-2"></div>
                                                </div>
                                                <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                                                    <div className="pdf-viewer">
                                                        <Viewer
                                                            fileUrl={selectedPaper?.file}
                                                            plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
                                                            onPageChange={(e) => setCurrentPage(e.currentPage)}
                                                        />
                                                    </div>
                                                </Worker>
                                            </div>
                                            <div className="right-panel">
                                                <div className="notes-tab">
                                                    <div className="border-accent">
                                                        <div className="border-line"></div>
                                                        <div className="border-line-2"></div>
                                                    </div>
                                                    <h3>
                                                        <Pencil size={16} />
                                                        AI-Generated Notes
                                                    </h3>
                                                    {notes[selectedPaper.id]?.length > 0 ? (
                                                        <div className="notes-list">
                                                            {notes[selectedPaper.id].some(note => note.isPinned) && (
                                                                <div className="pinned-items">
                                                                    <div className="pinned-header">
                                                                        <Pin size={16} />
                                                                        Pinned Notes
                                                                    </div>
                                                                    {notes[selectedPaper.id]
                                                                        .filter(note => note.isPinned)
                                                                        .map(renderNote)}
                                                                </div>
                                                            )}
                                                            {notes[selectedPaper.id]
                                                                .filter(note => !note.isPinned)
                                                                .map(renderNote)}
                                                        </div>
                                                    ) : (
                                                        <p>No notes yet. Highlight text in the PDF to generate notes.</p>
                                                    )}
                                                </div>
                                                
                                                <div className="video-suggestions-tab">
                                                    <div className="border-accent">
                                                        <div className="border-line"></div>
                                                        <div className="border-line-2"></div>
                                                    </div>
                                                    <h3>
                                                        <Video size={16} />
                                                        AI-Generated Video Suggestions
                                                    </h3>
                                                    {isVideoLoading && (
                                                        <div className="video-loading">
                                                            <span className="loading-spinner"></span>
                                                            <span>Searching for relevant videos...</span>
                                                        </div>
                                                    )}
                                                    
                                                    {videoSuggestions[selectedPaper?.id]?.length > 0 ? (
                                                        <div className="video-suggestions-container">
                                                            {/* Pinned Video Suggestions */}
                                                            {videoSuggestions[selectedPaper.id].some(suggestion => suggestion.isPinned) && (
                                                                <div className="pinned-items">
                                                                    <div className="pinned-header">
                                                                        <Pin size={16} />
                                                                        Pinned Videos
                                                                    </div>
                                                                    {videoSuggestions[selectedPaper.id]
                                                                        .filter(suggestion => suggestion.isPinned)
                                                                        .map(renderVideoSuggestion)}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Unpinned Video Suggestions */}
                                                            {videoSuggestions[selectedPaper.id]
                                                                .filter(suggestion => !suggestion.isPinned)
                                                                .map(renderVideoSuggestion)}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p>No video suggestions yet. Highlight text in the PDF to generate video suggestions.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {session && (
                                        <>
                                            <SearchPalette
                                                ref={searchPaletteRef}
                                                isOpen={isSearchOpen}
                                                onClose={() => setIsSearchOpen(false)}
                                                papers={papers}
                                                onSearch={handleSearch}
                                                selectedPaperIds={selectedPaperIds}
                                                setSelectedPaperIds={setSelectedPaperIds}
                                                isGeminiLoading={isGeminiLoading}
                                                totalPages={totalPages}
                                                setTotalPages={setTotalPages}
                                                query={query}
                                                setQuery={setQuery}
                                            />
                                        </>
                                    )}

                                    {session && isSearchHistoryOpen && (
                                        <div className="search-section">
                                            <SearchHistory 
                                                history={searchHistory}
                                                onSelect={handleSelectHistory}
                                                onDelete={handleDeleteHistory}
                                                onToggleFavorite={handleToggleFavorite}
                                            />
                                        </div>
                                    )}
                                    <VoiceSearch 
                                        onVoiceInput={handleVoiceInput}
                                        selectedPaper={selectedPaper}
                                        papers={papers}
                                    />
                                </>
                            )}
                        </>
                    }
                />
            </Routes>
            <WorkspacePalette
                ref={workspacePaletteRef}
                isOpen={isWorkspaceOpen}
                onClose={() => setIsWorkspaceOpen(false)}
                onWorkspaceChange={handleWorkspaceChange}
                currentWorkspace={currentWorkspace}
            />
            {session && location.pathname !== '/reset-password' && (
                <div className="cmd-k-hint">
                    <span>Press</span>
                    <span className="kbd">⌘</span>
                    <span>+</span>
                    <span className="kbd">K</span>
                    <span>to search or</span>
                    <span className="kbd">⌘</span>
                    <span>+</span>
                    <span className="kbd">I</span>
                    <span>for workspaces</span>
                </div>
            )}
        </div>
    );
}

export default App;
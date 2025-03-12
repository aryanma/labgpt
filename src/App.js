import React, { useState, useEffect, useCallback } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';
import { Pencil, Trash2, Pin, Video, ExternalLink, Clock, Eye } from 'lucide-react';
import { supabase } from './supabaseClient';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ResetPassword from './ResetPassword';
import SearchPalette from './components/SearchPalette';
import { searchPapers, processAndStorePdf } from './utils/searchUtils';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import './App.css';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
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
    const [videoSuggestions, setVideoSuggestions] = useState({}); // new
    const [isVideoLoading, setIsVideoLoading] = useState(false); // new
    const fileInputRef = React.useRef(null);
    const [session, setSession] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedPaperIds, setSelectedPaperIds] = useState([]);

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

            // Create suggestions with unique IDs
            const newSuggestions = data.items.map((item, index) => {
                const details = detailsData.items[index];
                return {
                    id: crypto.randomUUID(), // Add unique ID
                    paper_id: selectedPaper.id,
                    user_id: session.user.id,
                    video_id: item.id.videoId,
                    title: item.snippet.title,
                    duration: formatDuration(details.contentDetails.duration),
                    view_count: parseInt(details.statistics.viewCount).toLocaleString(),
                    timestamp: new Date().toISOString(),
                    is_pinned: false // Match database column name
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

    const loadPapers = useCallback(async () => {
        if (!session?.user) return;

        try {
            const { data, error } = await supabase
                .from('papers')
                .select('*')
                .order('date_added', { ascending: false });

            if (error) throw error;

            const loadedPapers = await Promise.all(data.map(async (paper) => {
                const { data: fileData, error: downloadError } = await supabase.storage
                    .from('pdfs')
                    .download(paper.file_path);

                if (downloadError) throw downloadError;

                const localUrl = URL.createObjectURL(fileData);

                return {
                    id: paper.id,
                    title: paper.title,
                    file: localUrl,
                    dateAdded: new Date(paper.date_added).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                };
            }));

            setPapers(loadedPapers);
        } catch (error) {
            console.error('Error loading papers:', error);
            alert('Error loading papers');
        }
    }, [session]);

    useEffect(() => {
        loadPapers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

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
                        <button className="highlight-button" onClick={() => setEditingNote(null)}>Cancel</button>
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
            // First delete all associated notes
            const { error: notesError } = await supabase
                .from('notes')
                .delete()
                .eq('paper_id', paperId);

            if (notesError) throw notesError;

            // Then delete all associated video suggestions
            const { error: videoError } = await supabase
                .from('video_suggestions')
                .delete()
                .eq('paper_id', paperId);

            if (videoError) throw videoError;

            // Get the paper's file path before deleting the paper record
            const paper = papers.find(p => p.id === paperId);
            if (!paper) return;

            // Delete the paper record from the database
            const { error: paperError } = await supabase
                .from('papers')
                .delete()
                .eq('id', paperId);

            if (paperError) throw paperError;

            // Delete the file from storage
            const { error: storageError } = await supabase.storage
                .from('pdfs')
                .remove([paper.file_path]);

            if (storageError) throw storageError;

            // Update local state
            setPapers(papers.filter(p => p.id !== paperId));
            setNotes(prevNotes => {
                const newNotes = { ...prevNotes };
                delete newNotes[paperId];
                return newNotes;
            });
            setVideoSuggestions(prevVideos => {
                const newVideos = { ...prevVideos };
                delete newVideos[paperId];
                return newVideos;
            });

            if (selectedPaper?.id === paperId) {
                setSelectedPaper(null);
            }

        } catch (error) {
            console.error('Error deleting paper:', error);
            alert('Error deleting paper');
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

            // Create new note
            const newNote = {
                id: crypto.randomUUID(),
                user_id: session.user.id,
                paper_id: selectedPaper.id,
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

            // Generate and save video suggestions
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
    
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });        
    
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
            // Load notes
            const { data: notesData, error: notesError } = await supabase
                .from('notes')
                .select('*')
                .eq('paper_id', paperId)
                .eq('user_id', session.user.id)
                .order('timestamp', { ascending: true });

            if (notesError) throw notesError;

            // Load video suggestions and remove duplicates
            const { data: videosData, error: videosError } = await supabase
                .from('video_suggestions')
                .select('*')
                .eq('paper_id', paperId)
                .eq('user_id', session.user.id)
                .order('timestamp', { ascending: false }); // Show newest first

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
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Add this function to handle search
    const handleSearch = async (query, selectedPaperIds) => {
        if (!selectedPaperIds.length) return;
        
        try {
            const relevantChunks = await searchPapers(query, selectedPaperIds);
            
            if (!relevantChunks.length) {
                return "I couldn't find any relevant content in the selected papers to answer your question.";
            }
            
            // Get paper titles for context
            const { data: papers } = await supabase
                .from('papers')
                .select('id, title')
                .in('id', selectedPaperIds);
                
            const paperTitles = papers.map(p => p.title).join('" and "');
            
            const context = relevantChunks.join('\n\n');
            
            const prompt = `You are analyzing the papers "${paperTitles}". 
Based on these relevant excerpts from the papers:

${context}

Please answer this question: ${query}

If the excerpts don't contain enough information to answer the question directly, summarize what you can understand from the available context. Be specific and cite the papers when possible.`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error('Error searching papers:', error);
            return "Sorry, there was an error processing your search. Please try again.";
        }
    };

    return (
        <Router>
            <Routes>
                {/* Reset Password Route */}
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Main App Route */}
                <Route
                    path="/"
                    element={
                        <div className="App">
                            <header className="App-header">
                                <h1>LabGPT</h1>
                                <p>Your AI-powered research assistant</p>
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
                                        {papers.map((paper) => (
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
                                        ))}
                                    </div>
                            
                                    {selectedPaper && (
                                        <div className="paper-viewer-container">
                                            <div className="pdf-container">
                                                <div className="border-accent">
                                                    <div className="border-line"></div>
                                                    <div className="border-line-2"></div>
                                                </div>
                                                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                                                    <div className="pdf-viewer">
                                                        <Viewer
                                                            fileUrl={selectedPaper.file}
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
                                                            <Video size={24} />
                                                            <p>No video suggestions yet. Highlight text in the PDF to generate video suggestions.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {session && (
                                        <>
                                            <div className="cmd-k-hint">
                                                Press <span className="kbd">⌘</span> + <span className="kbd">K</span> to search across papers
                                            </div>

                                            <SearchPalette
                                                isOpen={isSearchOpen}
                                                onClose={() => setIsSearchOpen(false)}
                                                papers={papers}
                                                onSearch={handleSearch}
                                                selectedPaperIds={selectedPaperIds}
                                                setSelectedPaperIds={setSelectedPaperIds}
                                            />
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
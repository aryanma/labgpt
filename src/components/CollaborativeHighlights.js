import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const CollaborativeHighlights = ({ workspace, paper, session }) => {
    const [highlights, setHighlights] = useState([]);
    const [comments, setComments] = useState({});

    useEffect(() => {
        loadHighlights();
        
        // Subscribe to real-time highlight updates
        const highlightSubscription = supabase
            .channel('highlight-changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'shared_highlights',
                    filter: `workspace_id=eq.${workspace.id}` 
                }, 
                loadHighlights
            )
            .subscribe();

        // Subscribe to comment updates
        const commentSubscription = supabase
            .channel('comment-changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'highlight_comments' 
                }, 
                loadComments
            )
            .subscribe();

        return () => {
            highlightSubscription.unsubscribe();
            commentSubscription.unsubscribe();
        };
    }, [workspace.id, paper.id]);

    const loadHighlights = async () => {
        const { data, error } = await supabase
            .from('shared_highlights')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    avatar_url
                )
            `)
            .eq('workspace_id', workspace.id)
            .eq('paper_id', paper.id);

        if (error) {
            console.error('Error loading highlights:', error);
            return;
        }

        setHighlights(data);
        loadComments(data.map(h => h.id));
    };

    const loadComments = async (highlightIds) => {
        const { data, error } = await supabase
            .from('highlight_comments')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    avatar_url
                )
            `)
            .in('highlight_id', highlightIds);

        if (error) {
            console.error('Error loading comments:', error);
            return;
        }

        // Group comments by highlight_id
        const commentsByHighlight = data.reduce((acc, comment) => {
            acc[comment.highlight_id] = acc[comment.highlight_id] || [];
            acc[comment.highlight_id].push(comment);
            return acc;
        }, {});

        setComments(commentsByHighlight);
    };

    const addComment = async (highlightId, content) => {
        const { error } = await supabase
            .from('highlight_comments')
            .insert({
                highlight_id: highlightId,
                user_id: session.user.id,
                content
            });

        if (error) {
            console.error('Error adding comment:', error);
            alert('Error adding comment');
        }
    };

    return (
        <div className="collaborative-highlights">
            {highlights.map(highlight => (
                <div key={highlight.id} className="highlight-item">
                    <div className="highlight-content">
                        <span 
                            className="highlight-marker"
                            style={{ backgroundColor: highlight.color }}
                        />
                        <p>{highlight.content}</p>
                        <div className="highlight-meta">
                            <img 
                                src={highlight.profiles.avatar_url} 
                                alt={highlight.profiles.full_name}
                                className="user-avatar"
                            />
                            <span>{highlight.profiles.full_name}</span>
                        </div>
                    </div>

                    <div className="highlight-comments">
                        {comments[highlight.id]?.map(comment => (
                            <div key={comment.id} className="comment">
                                <img 
                                    src={comment.profiles.avatar_url}
                                    alt={comment.profiles.full_name}
                                    className="user-avatar-small"
                                />
                                <div className="comment-content">
                                    <strong>{comment.profiles.full_name}</strong>
                                    <p>{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CollaborativeHighlights; 
import React from 'react';
import { Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const SearchHistory = ({ history, onSelect, onDelete, onToggleFavorite }) => {
    const handleSelect = (item) => {
        onSelect(item);
    };

    return (
        <div className="search-history">
            <div className="search-history-header">
                <span>Search History</span>
            </div>
            {history.map((item) => (
                <div key={item.id} className="search-history-item">
                    <div className="search-history-query" onClick={() => handleSelect(item)}>
                        {item.query}
                    </div>
                    <div className="search-history-meta">
                        <span>{format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}</span>
                        <div className="search-history-actions">
                            <button
                                onClick={() => onToggleFavorite(item.id)}
                                className={`action-button ${item.favorite ? 'favorite' : ''}`}
                            >
                                <Star size={14} fill={item.favorite ? '#ffd700' : 'none'} />
                            </button>
                            <button
                                onClick={() => onDelete(item.id)}
                                className="action-button"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SearchHistory; 
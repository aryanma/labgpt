"use client"

import { Check, Loader, Search } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import styles from "@/styles/SearchStyles.module.css"
import { Paper } from "@/types/Paper"
import useWorkspace from "@/hooks/workspace/useWorkspace"

// Sample data for development
const SAMPLE_PAPERS: Paper[] = [
  { 
    id: "1",
    title: "Paper 1",
    content: "Content 1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "1",
    workspace_id: "1"
  },
  { 
    id: "2",
    title: "Paper 2",
    content: "Content 2",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "1",
    workspace_id: "1"
  },
]

export default function SearchPopup({ 
    workspaceId,
 }: { 
    workspaceId: string,
 }) {
    // State management
    const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([])
    const [query, setQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { papers, isLoadingPapers } = useWorkspace(workspaceId)

    // Handlers
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        };

        document.addEventListener('keydown', handleEsc);

        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen]);
    
    const handlePaperToggle = (paperId: string) => {
        setSelectedPaperIds(prev => 
        prev.includes(paperId) 
            ? prev.filter(id => id !== paperId) 
            : [...prev, paperId]
        )
    }

    const handleSearch = () => {
        if (!query.trim() || selectedPaperIds.length === 0) return
        
        setIsSearching(true)
        // Add your search logic here
        console.log("Searching for:", query, "in papers:", selectedPaperIds)
        
        // Simulate API call
        setTimeout(() => {
        setIsSearching(false)
        }, 1000)
    }
  
    // Derived values
    const isSearchDisabled = !query.trim() || selectedPaperIds.length === 0 || isSearching

    return (
        <div 
        className={`search-overlay ${styles.searchOverlay}`} 
        >
            <div 
                className={styles.searchContainer}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* Search Header */}
                <div className={styles.searchHeader}>
                    <div className={styles.searchInputWrapper}>
                        <Search size={20} />
                        <input
                        ref={inputRef}
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search workspaces..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isSearchDisabled) {
                            handleSearch()
                            }
                        }}
                        />
                    </div>
                    <div className={styles.closeHint}>
                        <span className={styles.kbd}>esc</span>
                        <span className={styles.hintText}>to close</span>
                    </div>
                </div>

                {/* Paper List */}
                <div className="max-h-[300px] overflow-y-auto p-2">
                {SAMPLE_PAPERS.map(paper => (
                    <div 
                    key={paper.id}
                    className={`
                        flex items-center gap-3 p-3 m-1 rounded-lg cursor-pointer 
                        transition-all duration-200 ease-in-out hover:bg-[#f3f4f6] border
                        ${selectedPaperIds.includes(paper.id) 
                        ? 'bg-[#f0fdfd] border-[var(--primary)]' 
                        : 'border-[#d1d5db]'}
                    `}
                    onClick={() => handlePaperToggle(paper.id)}
                    >
                    <div 
                        className={`
                        w-[18px] h-[18px] border-2 rounded 
                        flex items-center justify-center transition-all duration-200 ease-in-out
                        ${selectedPaperIds.includes(paper.id) 
                            ? 'bg-[var(--primary)] border-[var(--primary)]' 
                            : 'border-[#d1d5db]'}
                        `}
                    >
                        {selectedPaperIds.includes(paper.id) && <Check size={14} color="white" />}
                    </div>
                    <span>{paper.title}</span>
                    </div>
                ))}
                </div>

                {/* Search Footer */}
                <div className="flex items-center justify-between p-4 border-t border-[#e5e7eb]">
                <span className="text-sm text-gray-500 selected-count">
                    {selectedPaperIds.length} papers selected
                </span>
                <button
                    className={`
                    text-white px-4 py-2 rounded-md text-sm border-none 
                    cursor-pointer transition-all duration-200 
                    ${isSearchDisabled ? 'bg-gray-400' : 'bg-[var(--primary)]'}
                    `}
                    disabled={isSearchDisabled}
                    onClick={handleSearch}
                >
                    {isSearching ? (
                    <div className="flex items-center gap-2">
                        <Loader size={14} className="animate-spin" />
                        <span>Searching...</span>
                    </div>
                    ) : (
                    'Search'
                    )}
                </button>
                </div>
            </div>
        </div>
    )
}
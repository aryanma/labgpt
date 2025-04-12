import { Button } from "@/components/ui/button";
import Image from "next/image";
import styles from "@/styles/VideoSuggestionStyles.module.css";

interface VideoSuggestion {
    id: string;
    title: string;
    url: string;
    view_count: number;
    duration: string;
}

type SuggestionsPopupProps = {
    isOpen: boolean;
    onClose: () => void;
}

const hardcodedSuggestions: VideoSuggestion[] = [
    {
        id: "1",
        title: "Video 1",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        view_count: 1000,
        duration: "10:00"
    },
    {
        id: "2",
        title: "Video 2",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        view_count: 2000,
        duration: "10:00"
    },
    {
        id: "3",
        title: "Video 3",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        view_count: 2000,
        duration: "10:00"
    },
    {
        id: "4",
        title: "Video 4",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        view_count: 2000,
        duration: "10:00"
    }
]

const VideoItem = ({ suggestion }: { suggestion: VideoSuggestion }) => {
    const videoId = suggestion.url.split('v=')[1]?.split('&')[0] || '';
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    
    return (
        <div className="flex p-3 rounded-lg hover:bg-gray-100 cursor-pointer" key={suggestion.id}>
            <div className="relative w-32 h-20 mr-3 rounded-md overflow-hidden flex-shrink-0">
                <Image 
                    src={thumbnailUrl} 
                    alt={suggestion.title}
                    width={128}
                    height={80}
                    className="object-cover"
                    unoptimized
                />
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                    {suggestion.duration}
                </div>
            </div>
            <div className="flex flex-col justify-between flex-1">
                <h4 className="text-sm font-medium line-clamp-2 text-gray-800">{suggestion.title}</h4>
                <div className="flex items-center text-xs text-gray-500">
                    <span className="flex items-center">{suggestion.view_count.toLocaleString()} views</span>
                </div>
            </div>
        </div>
    );
}

const OpenSuggestions = ({ suggestions }: { suggestions: VideoSuggestion[] }) => {
    return (
        <div className={styles.videoPlaceholders}>
            {suggestions.map((suggestion) => (
                <VideoItem suggestion={suggestion} key={suggestion.id} />
            ))}
        </div>
    )
}

function SuggestionsHeader({ onClose }: { onClose: () => void }) {
    return (
        <div className={styles.videoPopupHeader}>
            <h3>YouTube Suggestions</h3>
            <Button variant="ghost" size="sm" onClick={onClose}> × </Button>
        </div>
    )
}

export default function SuggestionsPopup({ isOpen, onClose }: SuggestionsPopupProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.videoSuggestionsPopup}>
            <SuggestionsHeader onClose={onClose} />
            <OpenSuggestions suggestions={hardcodedSuggestions} />
        </div>
    );
}
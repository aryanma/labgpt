import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import SearchPopup from "./SearchPopup";
import SearchShortcut from "./SearchShortcut";
import { useEffect, useState } from "react";


export default function SearchBtn({ workspaceId }: { workspaceId: string }) {
    const [popUpOpen, setPopUpOpen] = useState(false)

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPopUpOpen(false)
            }
        };

        document.addEventListener('keydown', handleEsc);

        return () => document.removeEventListener('keydown', handleEsc);
    }, [popUpOpen]);

    return (
        <>
            <Button onClick={() => setPopUpOpen(true)} variant="outline" size="icon" >
                <SearchIcon className="w-4 h-4" />
            </Button>
            <SearchPopup 
                workspaceId={workspaceId}
                isOpen={popUpOpen}
                setIsOpen={setPopUpOpen}
            />
            <SearchShortcut />
        </>
    )
}
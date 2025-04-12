"use client";
import styles from "@/styles/SearchStyles.module.css";
import { useEffect, useState } from "react";

export default function SearchShortcut() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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

    return (
        <div className={styles.cmdKHint}>
            Press <span className={styles.kbd}>⌘</span> + <span className={styles.kbd}>K</span> to search
            or <span className={styles.kbd}>⌘</span> + <span className={styles.kbd}>I</span> for workspaces
        </div>
    )
}
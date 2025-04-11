import { useRef } from "react";
import styles from "@/core/workspaces/style.module.css";

export default function UploadArea() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log(file);
        }
    }

    return (
        <div className="max-w-[800px] mx-auto my-8 px-6 text-center text-primary">
            <div className={styles.uploadSection}>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className={styles.uploadInput}
                    ref={fileInputRef}
                    id="file-upload"
                />
                <label htmlFor="file-upload" className={styles.uploadLabel}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload PDF
                </label>
            </div>
        </div>

    )
}
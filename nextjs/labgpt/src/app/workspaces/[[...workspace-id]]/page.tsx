"use client"
import { useAuth } from "@/core/global/hooks/useAuth";
import useWorkspace from "@/core/workspaces/hooks/useWorkspace";
import UploadArea from "@/core/workspaces/components/UploadArea";
import styles from "@/core/workspaces/style.module.css";
import PaperSelect from "@/core/workspaces/components/PaperSelect";
import { use } from "react";

interface PageProps {
    params: Promise<{
        "workspace-id": string;
    }>;
}

export default function Workspaces({ params }: PageProps) {
    const { handleSignOut } = useAuth()
    const resolvedParams = use(params);
    
    const workspaceId = resolvedParams["workspace-id"];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { papers, isLoadingPapers } = useWorkspace(workspaceId);

    return (
        <div className={styles.workspacesContainer}>
            <button onClick={handleSignOut} className={styles.logoutBtn}>Sign Out</button>
            <UploadArea />
            <PaperSelect workspaceId={workspaceId} />
        </div>
    );
}
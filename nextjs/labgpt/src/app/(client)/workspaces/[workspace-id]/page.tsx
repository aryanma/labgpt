"use client"
import { useAuth } from "@/hooks/auth/useAuth";
import useWorkspace from "@/hooks/workspace/useWorkspace";
import UploadArea from "@/components/Workspaces/UploadArea";
import styles from "@/styles/WorkspacesStyles.module.css";
import PaperSelect from "@/components/Workspaces/PaperSelect";
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
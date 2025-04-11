import { Workspace } from "@/core/workspaces/types/Workspace";
import styles from "./style.module.css";

type MainHeaderProps = {
    currentWorkspace: Workspace | null;
}

export default function MainHeader({ currentWorkspace } : MainHeaderProps) {

    return (
        <div className={styles.mainHeader}>
            <h1>LabGPT</h1>
            <div className={styles.headerActions}>
                <span className={styles.headerSubtitle}>Your AI-powered research assistant</span>
                {currentWorkspace && (
                    <div className="current-workspace">
                        <span>Workspace: {currentWorkspace.name}</span>
                    </div>
                )}
            </div>

        </div>
    );
}
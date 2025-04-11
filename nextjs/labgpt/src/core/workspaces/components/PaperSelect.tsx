import useWorkspace from "@/core/workspaces/hooks/useWorkspace";
import { Paper } from "@/core/workspaces/types/Workspace";

interface PaperSelectProps {
    workspaceId: string | undefined;
}

export default function PaperSelect({ workspaceId }: PaperSelectProps) {

    const { papers, isLoadingPapers } = useWorkspace(workspaceId);

    const handleSelectPaper = (paper: Paper) => {
        console.log(paper);
    }

    const handleDelete = (paperId: string) => {
        console.log(paperId);
    }

    return (
        <div className="papers-grid">
            {isLoadingPapers ? (
                <div className="loading-papers">
                    <span className="loading-spinner"></span>
                    <span>Loading papers...</span>
                </div>
            ) : papers.length > 0 ? (
                papers.map((paper) => (
                    <div
                        key={paper.id}
                        className="paper-card"
                        onClick={() => handleSelectPaper(paper)}
                    >
                        <h3>{paper.title}</h3>
                        <p className="date-added">{paper.date_added}</p>
                        <button
                            className="delete-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(paper.id);
                            }}
                        >
                            Delete
                        </button>
                    </div>
                ))
            ) : (
                <div className="no-papers">
                    <p>No papers found. Upload a PDF to get started!</p>
                </div>
            )}
        </div>
    )
}
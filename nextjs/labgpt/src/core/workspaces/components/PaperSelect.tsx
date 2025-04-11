import useWorkspace from "@/core/workspaces/hooks/useWorkspace";
import { Paper } from "@/core/workspaces/types/Workspace";
import { useRouter } from "next/navigation";
interface PaperSelectProps {
    workspaceId: string | undefined;
}

export default function PaperSelect({ workspaceId }: PaperSelectProps) {
    const router = useRouter();
    const { papers, isLoadingPapers } = useWorkspace(workspaceId);

    const handleSelectPaper = (paper: Paper) => {
        router.push(`/pages/${paper.id}`);
    }

    const handleDelete = (paperId: string) => {
        console.log(paperId);
    }

    return (
        <div className="max-w-[800px] mx-auto px-6">
            {isLoadingPapers ? (
                <div className="flex items-center justify-center w-full min-h-[200px] gap-3">
                    <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading papers...</span>
                </div>
            ) : papers.length > 0 ? (
                papers.map((paper) => (
                    <div
                        key={paper.id}
                        className="bg-white border border-[#e5e7eb] rounded-xl p-4 mb-4 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer flex justify-between items-center animate-[fadeIn_0.3s_ease-out]"
                        onClick={() => handleSelectPaper(paper)}
                    >
                        <h3>{paper.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{paper.date_added}</p>
                        <button
                            className="bg-transparent text-gray-500 py-1.5 px-3 rounded-md text-xs border-none cursor-pointer transition-all duration-200"
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
                <div className="flex flex-col items-center justify-center w-full min-h-[200px] text-center text-[#666] gap-4">
                    <p>No papers found. Upload a PDF to get started!</p>
                </div>
            )}
        </div>
    )
}
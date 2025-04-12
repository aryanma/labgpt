'use client'
import useWorkspace from "@/hooks/workspace/useWorkspace"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Workspaces() {
    const router = useRouter();
    const { workspaces, isLoadingWorkspaces } = useWorkspace(undefined, true);

    const handleWorkspaceClick = (workspaceId: string) => {
        router.push(`/workspaces/${workspaceId}`);
    };

    if (isLoadingWorkspaces) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Workspaces</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((workspace) => (
                    <Button
                        key={workspace.id}
                        onClick={() => handleWorkspaceClick(workspace.id)}
                        variant="outline"
                        className="h-auto p-6 flex flex-col items-start space-y-2 hover:bg-accent"
                    >
                        <h2 className="text-xl font-semibold">{workspace.name}</h2>
                    </Button>
                ))}
            </div>
        </div>
    );
}
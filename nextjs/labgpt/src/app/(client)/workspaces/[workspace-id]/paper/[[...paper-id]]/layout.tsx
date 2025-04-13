import type { Metadata } from "next";
import ToolBar from "@/components/ToolBar/Toolbar";
import { use } from "react";

export const metadata: Metadata = {
  title: "Workspaces | LabGPT",
  description: "Manage your research workspaces",
};

export default function WorkspacesLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{
	"workspace-id": string;
  }>;
}>) {
	const resolvedParams = use(params);
    const workspaceId = resolvedParams["workspace-id"] as string;

	return (
		<>
			<ToolBar workspaceId={workspaceId} />
			{children}
		</>
	);
}

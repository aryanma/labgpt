import type { Metadata } from "next";
import ToolBar from "@/components/ToolBar/Toolbar";

export const metadata: Metadata = {
  title: "Workspaces | LabGPT",
  description: "Manage your research workspaces",
};

export default function WorkspacesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ToolBar />
      {children}
    </>
  );
}

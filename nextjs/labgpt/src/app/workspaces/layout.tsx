import MainHeader from "@/core/global/components/MainHeader/MainHeader";
import type { Metadata } from "next";

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
      <MainHeader currentWorkspace={null} />
      {children}
    </>
  );
}

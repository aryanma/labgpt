"use client"
import useWorkspace from "@/global/hooks/useWorkspace";

export default function Home() {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { papers, isLoadingPapers, loadWorkspacePapers } = useWorkspace();

  return (
    <div className="">
      <h1>Hello World</h1>
    </div>
  );
}

import { useState } from "react";

export default function useWorkspace() {
    const [currentWorkspace, setCurrentWorkspace] = useState(null);

    return { currentWorkspace, setCurrentWorkspace };
}
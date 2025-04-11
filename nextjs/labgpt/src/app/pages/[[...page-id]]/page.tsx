'use client';

import usePaper from "@/core/page-viewer/hooks/usePaper";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { highlightPlugin } from "@react-pdf-viewer/highlight";
import React from "react";

// Import the styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import { use } from "react";

interface PageProps {
    params: Promise<{
        "page-id": string;
    }>;
}



export default function Page({ params }: PageProps) {
    const resolvedParams = use(params);
    const pageId = resolvedParams["page-id"] as string;

    const { paper, paperUrl, isLoadingPaper } = usePaper(pageId);
    
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    const highlightPluginInstance = highlightPlugin();

    return (
        <div className="flex flex-col h-screen w-full">
            <div className="flex-1 relative">
                {isLoadingPaper ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : paper?.file_path && paperUrl ? (
                    <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                        <div className="h-full w-full">
                            <Viewer
                                fileUrl={paperUrl}
                                plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
                            />
                        </div>
                    </Worker>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No PDF file found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
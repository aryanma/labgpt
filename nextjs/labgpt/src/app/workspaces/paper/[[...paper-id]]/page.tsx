'use client';

import React, { use, useState, useRef, useEffect } from "react";
import PdfViewer from "@/components/PDFView/PdfViewer";
import NewChatInterface from "@/components/ChatInterface/ChatInterface";

interface PageProps {
    params: Promise<{
        "paper-id": string;
    }>;
}

export default function Page({ params }: PageProps) {
    const resolvedParams = use(params);
    const paperId = resolvedParams["paper-id"] as string;
    const [pdfWidth, setPdfWidth] = useState(50); // Initial width percentage
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            
            // Limit the width between 20% and 80%
            const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
            setPdfWidth(clampedWidth);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div ref={containerRef} className="flex h-screen w-full">
            <div style={{ width: `${pdfWidth}%` }} className="h-full">
                <PdfViewer paperId={paperId} />
            </div>
            <div 
                className="w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300 active:bg-gray-400 transition-colors"
                onMouseDown={handleMouseDown}
            />
            <div style={{ width: `${100 - pdfWidth}%` }} className="h-full">
                <NewChatInterface paperId={paperId} />
            </div>
        </div>
    );
}
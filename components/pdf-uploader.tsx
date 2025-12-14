"use client";

import { useState } from "react";

export function PDFUploader({ onUploadComplete }: { onUploadComplete: (path: string) => void }) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", e.target.files[0]);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.path) {
                onUploadComplete(data.path);
            }
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-xl border-gray-300 hover:border-blue-500 transition-colors">
            <h2 className="text-xl font-semibold">Upload Study Material</h2>
            <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
        "
            />
            {uploading && <p className="text-sm text-blue-600">Uploading...</p>}
        </div>
    );
}

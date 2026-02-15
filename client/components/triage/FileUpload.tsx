"use client";

import { useRef } from "react";
import { Upload, FileText } from "lucide-react";
import { useUserStore } from "@/store/userStore";

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onError: (message: string) => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

export default function FileUpload({
  file,
  onFileChange,
  onError,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMedicalFile = useUserStore((s) => s.addMedicalFile);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected && ACCEPTED_TYPES.includes(selected.type)) {
      onFileChange(selected);
      addMedicalFile({ fileName: selected.name });
      onError("");
    } else {
      onError("Please select a valid file (PDF or image).");
      onFileChange(null);
    }
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 px-6 py-6 transition-colors hover:border-blue-500"
    >
      <Upload className="h-8 w-8 text-zinc-500" />
      {file ? (
        <div className="flex items-center gap-2 text-sm text-white">
          <FileText className="h-4 w-4 text-blue-400" />
          {file.name}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">Upload a PDF or image report (optional)</p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

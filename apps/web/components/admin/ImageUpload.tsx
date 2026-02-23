"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type PreviewItem = {
  src: string;
  kind: "existing" | "blob";
};

interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  existingImages?: string[];

  // NEW
  onRemoveExisting?: (url: string) => void; // so parent can mark for deletion
  maxSizeMB?: number; // default 5MB
}

export default function ImageUpload({
  onUpload,
  maxFiles = 5,
  existingImages = [],
  onRemoveExisting,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const initialPreviews: PreviewItem[] = useMemo(
    () => existingImages.map((src) => ({ src, kind: "existing" as const })),
    // only set once; parent can re-mount component if needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [previews, setPreviews] = useState<PreviewItem[]>(initialPreviews);
  const [error, setError] = useState<string>("");

  // cleanup all blob URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.kind === "blob") URL.revokeObjectURL(p.src);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usedCount = previews.length;

  const validateFiles = (files: File[]) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const maxBytes = maxSizeMB * 1024 * 1024;

    for (const f of files) {
      if (!allowed.includes(f.type)) {
        return `Unsupported file type: ${f.name}. Use PNG/JPG/WEBP.`;
      }
      if (f.size > maxBytes) {
        return `File too large: ${f.name}. Max ${maxSizeMB}MB per image.`;
      }
    }
    return "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (files.length + previews.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed.`);
      e.target.value = ""; // reset input
      return;
    }

    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      e.target.value = "";
      return;
    }

    const newPreviewItems: PreviewItem[] = files.map((file) => ({
      src: URL.createObjectURL(file),
      kind: "blob",
    }));

    setPreviews((prev) => [...prev, ...newPreviewItems]);
    onUpload(files);

    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    setError("");
    setPreviews((prev) => {
      const item = prev[index];
      if (!item) return prev;

      // cleanup if blob
      if (item.kind === "blob") URL.revokeObjectURL(item.src);

      // notify parent if removing existing URL
      if (item.kind === "existing") {
        onRemoveExisting?.(item.src);
      }

      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[#111827] mb-2">
        Product Images ({usedCount}/{maxFiles})
      </label>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {previews.map((preview, index) => (
          <div
            key={`${preview.kind}-${preview.src}-${index}`}
            className="relative aspect-square rounded-lg overflow-hidden border border-[#E5E7EB]"
          >
            <Image src={preview.src} alt={`Preview ${index + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              aria-label="Remove image"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {preview.kind === "existing" && (
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                Existing
              </div>
            )}
          </div>
        ))}

        {previews.length < maxFiles && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-[#E5E7EB] flex flex-col items-center justify-center cursor-pointer hover:border-[#1E2A78] transition-colors">
            <svg
              className="w-8 h-8 text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm text-gray-500">Add Image</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">PNG/JPG/WEBP. Max {maxSizeMB}MB per image.</p>
    </div>
  );
}

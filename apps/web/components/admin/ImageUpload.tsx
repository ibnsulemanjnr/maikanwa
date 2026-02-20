'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  existingImages?: string[];
}

export default function ImageUpload({ onUpload, maxFiles = 5, existingImages = [] }: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>(existingImages);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previews.length > maxFiles) {
      alert(`Maximum ${maxFiles} images allowed`);
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
    onUpload(files);
  };

  const handleRemove = (index: number) => {
    setPreviews(previews.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[#111827] mb-2">
        Product Images ({previews.length}/{maxFiles})
      </label>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {previews.map((preview, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-[#E5E7EB]">
            <Image src={preview} alt={`Preview ${index + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        
        {previews.length < maxFiles && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-[#E5E7EB] flex flex-col items-center justify-center cursor-pointer hover:border-[#1E2A78] transition-colors">
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
    </div>
  );
}

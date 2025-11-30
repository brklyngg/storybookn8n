'use client';

import { useState, useCallback } from 'react';
import { Camera, User, X, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface HeroPhotoUploadProps {
  value: string | null;
  onChange: (base64: string | null) => void;
}

export function HeroPhotoUpload({ value, onChange }: HeroPhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearPhoto = () => {
    onChange(null);
  };

  return (
    <div className="relative">
      <label
        className={`
          block cursor-pointer
          transition-all duration-300
          ${isDragging ? 'scale-105' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className={`
          relative overflow-hidden rounded-2xl
          border-2 border-dashed transition-all duration-300
          ${isDragging
            ? 'border-amber-400 bg-amber-50'
            : value
              ? 'border-transparent'
              : 'border-stone-200 hover:border-amber-400 hover:bg-amber-50/30'
          }
        `}>
          {value ? (
            <div className="relative aspect-square w-full max-w-[200px] mx-auto">
              <Image
                src={value}
                alt="Hero photo"
                fill
                className="object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-xl" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-xs font-medium text-white/90 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Hero photo set
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    clearPhoto();
                  }}
                  className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-100 to-stone-100 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-inner">
                  <User className="h-6 w-6 text-stone-400" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-stone-600">
                  Add hero photo
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Optional: Upload a face photo for the main character
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                <Camera className="h-3 w-3" />
                <span>Personalize your story</span>
              </div>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}

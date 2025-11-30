'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, BookOpen } from 'lucide-react';
import { Card } from './ui';

interface StoryInputProps {
  value: string;
  onChange: (value: string) => void;
  fileName?: string;
  onFileChange?: (name: string) => void;
}

export function StoryInput({ value, onChange, fileName, onFileChange }: StoryInputProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (file.type === 'text/plain') {
      const text = await file.text();
      onChange(text);
      onFileChange?.(file.name);
    } else {
      alert('Please upload a .txt file');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
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
    if (file) handleFileUpload(file);
  };

  const clearFile = () => {
    onChange('');
    onFileChange?.('');
  };

  return (
    <div className="space-y-4">
      {/* Main textarea */}
      <div className="relative">
        <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
          <BookOpen className="h-5 w-5 text-amber-500/60" />
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Once upon a time, in a land far, far away..."
          className={`
            w-full min-h-[280px] pl-12 pr-4 pt-4 pb-4 rounded-2xl
            bg-white/90 backdrop-blur-sm
            border-2 transition-all duration-300 resize-y
            text-stone-800 placeholder:text-stone-400
            focus:outline-none
            ${isDragging
              ? 'border-amber-400 bg-amber-50/50 shadow-lg shadow-amber-500/10'
              : 'border-stone-200 hover:border-stone-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        />

        {/* Word count */}
        <div className="absolute bottom-4 right-4 text-xs text-stone-400">
          {value.split(/\s+/).filter(Boolean).length} words
        </div>
      </div>

      {/* File upload area */}
      <Card
        variant="bordered"
        padding="none"
        className="cursor-pointer group"
      >
        <label className="flex items-center justify-center gap-3 p-5 cursor-pointer">
          <input
            type="file"
            accept=".txt"
            onChange={handleInputChange}
            className="hidden"
          />

          {fileName ? (
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-700">{fileName}</p>
                <p className="text-xs text-stone-500">Click to replace</p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  clearFile();
                }}
                className="h-8 w-8 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-stone-400" />
              </button>
            </div>
          ) : (
            <>
              <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <Upload className="h-6 w-6 text-stone-400 group-hover:text-amber-600 transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-stone-600 group-hover:text-amber-700 transition-colors">
                  Upload a story file
                </p>
                <p className="text-xs text-stone-400">
                  Drop a .txt file or click to browse
                </p>
              </div>
            </>
          )}
        </label>
      </Card>
    </div>
  );
}

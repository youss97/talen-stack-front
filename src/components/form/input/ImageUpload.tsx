import React, { useRef } from "react";
import { TrashBinIcon } from "@/icons";

interface ImageUploadProps {
  label?: string;
  accept?: string;
  preview?: string | null;
  fileName?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  shape?: "square" | "circle";
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
}

export default function ImageUpload({
  label,
  accept = "image/*",
  preview,
  fileName,
  disabled = false,
  error = false,
  helperText,
  shape = "square",
  onChange,
  onRemove,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onChange) {
      onChange(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onRemove) {
      onRemove();
    }
    if (onChange) {
      onChange(null);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      <div
        onClick={handleClick}
        className={`relative h-32 w-full rounded-lg border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : error
            ? "border-error-500 bg-error-50 dark:bg-error-500/10"
            : "border-gray-300 hover:border-brand-400 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        }`}
      >
        {preview ? (
          <div className="relative w-full h-full p-4 flex items-center justify-center">
            <img
              src={preview}
              alt="Preview"
              className={`max-w-full max-h-full object-contain ${
                shape === "circle" ? "rounded-full" : "rounded"
              }`}
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-error-500 text-white rounded-full hover:bg-error-600 transition-colors shadow-lg"
                title="Supprimer"
              >
                <TrashBinIcon className="w-4 h-4 fill-current" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center p-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {fileName || "Cliquez pour sélectionner une image"}
            </p>
            <p className="mt-1 text-xs text-gray-400">PNG, JPG, GIF jusqu'à 10MB</p>
          </div>
        )}
      </div>

      {helperText && (
        <p className={`mt-1 text-sm ${error ? "text-error-500" : "text-gray-500"}`}>
          {helperText}
        </p>
      )}
    </div>
  );
}

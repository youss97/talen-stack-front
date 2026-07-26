import React, { useRef } from "react";
import { Upload } from "lucide-react";
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
            <Upload size={48} strokeWidth={1.8} className="icon-glow mx-auto text-gray-400" />
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

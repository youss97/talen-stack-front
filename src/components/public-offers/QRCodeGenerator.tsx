"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Button from "@/components/ui/button/Button";

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  brandColor?: string;
}

export default function QRCodeGenerator({ url, size = 300, brandColor = "#3B82F6" }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (canvasRef.current && url) {
      generateQRCode();
    }
  }, [url, size, brandColor]);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    try {
      await QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: brandColor,
          light: "#FFFFFF",
        },
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const downloadQRCode = () => {
    if (!canvasRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = canvasRef.current;
      const link = document.createElement("a");
      link.download = `qr-code-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <canvas ref={canvasRef} />
      </div>
      <Button
        onClick={downloadQRCode}
        disabled={isGenerating}
        startIcon={<DownloadIcon />}
      >
        {isGenerating ? "Téléchargement..." : "Télécharger QR Code"}
      </Button>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
        Scannez ce QR code pour accéder directement à l'offre d'emploi
      </p>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M17.5 12.5V13.5C17.5 14.9001 17.5 15.6002 17.2275 16.135C16.9878 16.6054 16.6054 16.9878 16.135 17.2275C15.6002 17.5 14.9001 17.5 13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V12.5M14.1667 8.33333L10 12.5M10 12.5L5.83333 8.33333M10 12.5V2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

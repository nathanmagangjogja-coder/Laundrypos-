'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw, XCircle, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (errorMessage: string) => void;
}

export default function BarcodeScanner({
  onScan,
  onError,
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerId = 'barcode-scanner-container';

  useEffect(() => {
    // Initialize Html5Qrcode instance for file scanning even if camera isn't started
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode(containerId);
    }

    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label })));
          setActiveCameraId(devices[0].id);
        }
      })
      .catch((err) => {
        console.error('Error getting cameras', err);
      });

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!activeCameraId) {
      toast.error('Kamera tidak ditemukan');
      return;
    }

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(containerId);
      }
      
      setIsScanning(true);

      await html5QrCodeRef.current.start(
        activeCameraId,
        {
          fps: 20,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.777778,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        } as any,
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {
          // Silent errors
        }
      );
    } catch (err: any) {
      console.error('Failed to start scanning', err);
      setIsScanning(false);
      if (onError) onError(err.message || 'Gagal memulai scanner');
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Failed to stop scanning', err);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // If camera is scanning, stop it first
    if (isScanning) await stopScanning();

    try {
      // Create a temporary instance if needed, or use existing one
      // Note: scanFile doesn't require the camera to be active
      const scanner = html5QrCodeRef.current || new Html5Qrcode(containerId);
      
      const result = await scanner.scanFileV2(file, true);
      onScan(result.decodedText);
      toast.success('Barcode ditemukan di foto');
    } catch (err: any) {
      console.error('File scan error', err);
      toast.error('Tidak dapat menemukan barcode di foto ini. Pastikan gambar jelas.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setActiveCameraId(cameras[nextIndex].id);
    
    if (isScanning) {
      stopScanning().then(() => startScanning());
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-black shadow-inner">
      <div id={containerId} className="w-full min-h-[300px]" />
      
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />

      {!isScanning && !isUploading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all p-6 text-center">
          <div className="mb-4 flex gap-3">
            <div className="rounded-full bg-primary/20 p-4">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <div className="rounded-full bg-emerald-500/20 p-4">
              <ImageIcon className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          
          <p className="mb-4 text-sm font-medium text-white">Gunakan Kamera atau Unggah Foto</p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={startScanning} className="rounded-full px-6">
              <Camera className="mr-2 h-4 w-4" /> Buka Kamera
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => fileInputRef.current?.click()} 
              className="rounded-full px-6 bg-white/10 text-white hover:bg-white/20 border-none"
            >
              <Upload className="mr-2 h-4 w-4" /> Unggah Foto
            </Button>
          </div>
          
          <p className="mt-4 text-[10px] text-white/50 italic">
            Tips: Pastikan barcode terlihat jelas dan tidak buram
          </p>
        </div>
      ) : isUploading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-sm font-medium text-white">Menganalisis foto...</p>
        </div>
      ) : (
        <div className="absolute top-4 right-4 flex gap-2">
          {cameras.length > 1 && (
            <Button variant="secondary" size="icon" onClick={toggleCamera} className="rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border-none">
              <RefreshCw className="h-4 w-4 text-white" />
            </Button>
          )}
          <Button variant="destructive" size="icon" onClick={stopScanning} className="rounded-full backdrop-blur-md">
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isScanning && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[280px] h-[150px] border-2 border-primary/50 rounded-lg relative">
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-sm"></div>
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-sm"></div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-sm"></div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-sm"></div>
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/50 animate-scan-line shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
          </div>
        </div>
      )}
    </div>
  );
}

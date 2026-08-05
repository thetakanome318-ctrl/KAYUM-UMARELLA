import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, X, RefreshCw, Sparkles, Check, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
  isLight?: boolean;
}

export const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess, onClose, isLight = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [successText, setSuccessText] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Friendly synthesized beep when scan succeeds
  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // high A pitch
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn('AudioContext beep failed:', e);
    }
  };

  const startCamera = async () => {
    // Stop any existing stream first
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasCamera(true);
      setErrorMsg('');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video metadata to load before starting scan loop
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error('Play failed:', err);
          });
          startScanLoop();
        };
      }
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setHasCamera(false);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Silakan berikan izin akses kamera di pengaturan browser Anda.'
          : 'Tidak dapat mengakses kamera. Pastikan kamera tidak digunakan oleh aplikasi lain.'
      );
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startScanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const scan = () => {
      if (!isScanning) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Analyze current frame
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          setIsScanning(false);
          setSuccessText(code.data);
          playBeepSound();
          
          // Small success animation/delay before returning
          setTimeout(() => {
            onScanSuccess(code.data);
          }, 800);
          return;
        }

        // Draw helper bounding targeting box in preview UI
        const boxSize = Math.min(canvas.width, canvas.height) * 0.6;
        const x = (canvas.width - boxSize) / 2;
        const y = (canvas.height - boxSize) / 2;

        ctx.strokeStyle = '#22c55e'; // green-500
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, boxSize, boxSize);

        // Draw corner guides
        ctx.fillStyle = '#22c55e';
        const len = 20;
        const t = 4;
        // Top Left
        ctx.fillRect(x - t, y - t, len, t);
        ctx.fillRect(x - t, y - t, t, len);
        // Top Right
        ctx.fillRect(x + boxSize - len + t, y - t, len, t);
        ctx.fillRect(x + boxSize, y - t, t, len);
        // Bottom Left
        ctx.fillRect(x - t, y + boxSize, len, t);
        ctx.fillRect(x - t, y + boxSize - len + t, t, len);
        // Bottom Right
        ctx.fillRect(x + boxSize - len + t, y + boxSize, len, t);
        ctx.fillRect(x + boxSize, y + boxSize - len + t, t, len);
      }

      animationFrameRef.current = requestAnimationFrame(scan);
    };

    animationFrameRef.current = requestAnimationFrame(scan);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isLight ? 'border-slate-100' : 'border-slate-800'
        }`}>
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-emerald-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold">QR Code Scanner</h3>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Arahkan kamera ke QR Code Section / Gardu
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className={`p-1.5 rounded-lg transition ${
              isLight ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Stage */}
        <div className="relative aspect-square bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center space-y-3 max-w-xs">
              <CameraOff className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-xs font-semibold text-rose-400">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 font-bold text-white rounded-lg transition"
              >
                Coba Lagi
              </button>
            </div>
          ) : hasCamera === false ? (
            <div className="p-6 text-center space-y-2">
              <CameraOff className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-xs text-slate-400">Kamera tidak ditemukan atau tidak didukung.</p>
            </div>
          ) : (
            <>
              {/* Invisible HTML5 Video Tag */}
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
              />
              {/* Main Scanning Frame Draw */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Real-time scan feedback laser line */}
              {isScanning && (
                <div className="absolute left-[10%] right-[10%] top-1/2 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-[bounce_2s_infinite] pointer-events-none" />
              )}

              {/* Scanning Target frame graphic Overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                  <div className="flex justify-between">
                    <span className="text-[10px] bg-slate-900/80 text-emerald-400 font-black px-2 py-1 rounded backdrop-blur">
                      AUTO FOCUSING...
                    </span>
                  </div>
                  <div className="text-center pb-2">
                    <span className="text-[11px] bg-slate-900/80 text-white font-semibold px-3 py-1.5 rounded-full backdrop-blur">
                      Posisikan QR di dalam kotak hijau
                    </span>
                  </div>
                </div>
              )}

              {/* Success Screen Overlay */}
              {successText && (
                <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 rounded-full flex items-center justify-center animate-bounce mb-3">
                    <Check className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-400">QR Code Terdeteksi!</h4>
                  <p className="text-xs text-emerald-200 mt-2 font-mono break-all max-w-xs bg-emerald-950 p-2.5 rounded-xl border border-emerald-900/50">
                    {successText}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer controls */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <span className={`text-[10px] font-bold ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Powered by HTML5 Camera API
          </span>
          {hasCamera && isScanning && (
            <button
              onClick={toggleCamera}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center space-x-1.5 transition ${
                isLight 
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ganti Kamera</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export interface ParsedQrResult {
  penyulang?: string;
  section?: string;
  kodeGardu?: string;
  kapasitas?: string;
}

export function parseQrContent(text: string): ParsedQrResult {
  const result: ParsedQrResult = {};
  
  // 1. Try JSON parsing
  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object') {
      if (data.penyulang) result.penyulang = String(data.penyulang).trim();
      if (data.section) result.section = String(data.section).trim();
      if (data.kodeGardu) result.kodeGardu = String(data.kodeGardu).trim();
      if (data.kapasitas) result.kapasitas = String(data.kapasitas).trim();
      return result;
    }
  } catch (e) {
    // Not JSON, continue with pattern matching
  }

  // 2. Try Key-Value pairs line by line (e.g. Penyulang: BAGUALA)
  const lines = text.split('\n');
  lines.forEach(line => {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim().toLowerCase();
      const val = parts.slice(1).join(':').trim();
      if (key.includes('penyulang') || key === 'p') {
        result.penyulang = val;
      } else if (key.includes('section') || key === 's') {
        result.section = val;
      } else if (key.includes('gardu') || key === 'g' || key.includes('kode')) {
        result.kodeGardu = val;
      } else if (key.includes('kapasitas') || key === 'k') {
        result.kapasitas = val;
      }
    }
  });

  if (result.penyulang || result.section || result.kodeGardu) {
    return result;
  }

  // 3. Try hyphen-separated combined key (e.g. BAGUALA-S03-GD01)
  const parts = text.split(/[-/]/);
  if (parts.length >= 2) {
    result.penyulang = parts[0].trim();
    result.section = parts[1].trim();
    if (parts[2]) {
      result.kodeGardu = parts[2].trim();
    }
    return result;
  }

  // 4. Fallback: treat the entire string as Section or Penyulang
  const cleanText = text.trim();
  if (cleanText.toLowerCase().startsWith('s') && cleanText.length <= 5) {
    result.section = cleanText;
  } else {
    result.penyulang = cleanText;
  }

  return result;
}


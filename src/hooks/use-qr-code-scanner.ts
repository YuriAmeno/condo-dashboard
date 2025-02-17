import { useState, useCallback, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface UseQRCodeScannerProps {
  onResult: (result: string) => void;
  onError?: (error: string) => void;
}

export function useQRCodeScanner({ onResult, onError }: UseQRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = useCallback(async (elementId: string) => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(elementId);
      }

      const scanner = scannerRef.current;
      setIsScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onResult(decodedText);
        },
        (errorMessage) => {
          if (onError && !errorMessage.includes('NotFound')) {
            onError(errorMessage);
          }
        }
      );
    } catch (error) {
      setIsScanning(false);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to start scanner');
      }
    }
  }, [onResult, onError]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (error) {
        if (onError) {
          onError('Failed to stop scanner');
        }
      }
    }
  }, [isScanning, onError]);

  const toggleScanner = useCallback(async (elementId: string) => {
    if (isScanning) {
      await stopScanner();
    } else {
      await startScanner(elementId);
    }
  }, [isScanning, startScanner, stopScanner]);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {
          // Ignore cleanup errors
        });
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, []);

  return {
    isScanning,
    startScanner,
    stopScanner,
    toggleScanner,
  };
}
import React, { useEffect, useRef, useState } from "react";
import { useToast } from "./ToastProvider";

// QuaggaJS will be loaded dynamically via script tag to avoid Vite module resolution issues
declare global {
  interface Window {
    Quagga: any;
  }
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcodeValue: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const detectionHandlerRef = useRef<((result: any) => void) | null>(null);
  const { showToast } = useToast();

  const stopScan = () => {
    try {
      const Quagga = window.Quagga;
      if (Quagga && detectionHandlerRef.current) {
        Quagga.offDetected(detectionHandlerRef.current);
        detectionHandlerRef.current = null;
      }
      if (Quagga) {
        Quagga.stop();
      }
    } catch (err) {
      // Quagga might not be initialized, ignore errors
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopScan();
      return;
    }

    if (!scannerRef.current) {
      return;
    }

    setIsScanning(true);

    const initializeScanner = async () => {
      try {
        // Load QuaggaJS via script tag using CDN to avoid Vite module resolution issues
        let Quagga = window.Quagga;
        
        if (!Quagga) {
          // Load the script if not already loaded
          await new Promise<void>((resolve, reject) => {
            // Check if script is already being loaded
            const existingScript = document.querySelector('script[data-quagga]');
            if (existingScript) {
              const checkQuagga = setInterval(() => {
                if (window.Quagga) {
                  clearInterval(checkQuagga);
                  resolve();
                }
              }, 100);
              setTimeout(() => {
                clearInterval(checkQuagga);
                if (!window.Quagga) {
                  reject(new Error('Quagga failed to load'));
                }
              }, 5000);
              return;
            }

            const script = document.createElement('script');
            // Use jsDelivr CDN for QuaggaJS
            script.src = 'https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.10.2/dist/quagga.min.js';
            script.setAttribute('data-quagga', 'true');
            script.onload = () => {
              // Wait a bit for Quagga to be available on window
              const checkQuagga = setInterval(() => {
                if (window.Quagga) {
                  clearInterval(checkQuagga);
                  resolve();
                }
              }, 100);
              setTimeout(() => {
                clearInterval(checkQuagga);
                if (!window.Quagga) {
                  reject(new Error('Quagga failed to load'));
                }
              }, 5000);
            };
            script.onerror = () => reject(new Error('Failed to load QuaggaJS script'));
            document.head.appendChild(script);
          });
          
          Quagga = window.Quagga;
        }

        if (!Quagga) {
          throw new Error('Quagga is not available');
        }

        const detectionHandler = (result: any) => {
          const code = result.codeResult.code;
          if (code) {
            onScanSuccess(code);
            stopScan();
            onClose();
          }
        };

        detectionHandlerRef.current = detectionHandler;

        Quagga.init(
          {
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: scannerRef.current,
              constraints: {
                facingMode: "environment", // Use back camera on mobile
              },
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            numOfWorkers: 2,
            decoder: {
              readers: [
                "ean_reader",
                "ean_8_reader",
                "code_128_reader",
                "upc_reader",
                "upc_e_reader",
              ],
            },
            locate: true,
          },
          (err: any) => {
            if (err) {
              console.error("Quagga initialization error:", err);
              showToast("لا يمكن الوصول إلى الكاميرا. الرجاء التحقق من الصلاحيات.", 'error');
              setIsScanning(false);
              onClose();
              return;
            }
            Quagga.onDetected(detectionHandler);
            Quagga.start();
          }
        );
      } catch (err) {
        console.error("Error loading QuaggaJS:", err);
        showToast("حدث خطأ في تحميل قارئ الباركود.", 'error');
        setIsScanning(false);
        onClose();
      }
    };

    initializeScanner();

    return () => {
      stopScan();
    };
  }, [isOpen, onClose, onScanSuccess, showToast]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-center mb-4">
          وجه الكاميرا نحو الباركود
        </h3>
        <div className="relative w-full aspect-video bg-gray-900 rounded-md overflow-hidden">
          <div
            ref={scannerRef}
            className="w-full h-full"
            style={{ position: "relative" }}
          >
            {isScanning && (
              <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-10">
                <div className="w-11/12 h-2/3 border-4 border-dashed border-gray-400 rounded-lg opacity-75"></div>
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-scan"></div>
              </div>
            )}
            {!isScanning && (
              <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 z-10">
                <p className="text-white text-lg">جاري تشغيل الكاميرا...</p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-3 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700"
        >
          إلغاء
        </button>
        <style>{`
          @keyframes scan-animation {
            0% { transform: translateY(-33%); }
            50% { transform: translateY(33%); }
            100% { transform: translateY(-33%); }
          }
          .animate-scan {
            animation: scan-animation 1.5s ease-in-out infinite;
          }
          /* QuaggaJS video styling */
          #interactive.viewport {
            width: 100%;
            height: 100%;
            position: relative;
          }
          #interactive.viewport > canvas,
          #interactive.viewport > video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        `}</style>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;

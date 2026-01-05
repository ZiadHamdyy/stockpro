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

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      if (!scannerRef.current) {
        showToast("خطأ في تحميل قارئ الباركود.", 'error');
        onClose();
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

          // Ensure scannerRef is still available
          if (!scannerRef.current) {
            throw new Error('Scanner element is not available');
          }

          const detectionHandler = (result: any) => {
            try {
              if (!result || !result.codeResult) {
                return;
              }

              const code = result.codeResult.code;
              const format = result.codeResult.format || 'unknown';
              
              if (code && code.length > 0) {
                console.log("Barcode detected:", code, "Format:", format);
                onScanSuccess(code);
                stopScan();
                onClose();
              }
            } catch (err) {
              console.error("Error processing barcode:", err);
            }
          };

          detectionHandlerRef.current = detectionHandler;

          // Stop any existing Quagga instance
          try {
            Quagga.stop();
          } catch (e) {
            // Ignore if not running
          }

          Quagga.init(
            {
              inputStream: {
                name: "Live",
                type: "LiveStream",
                target: scannerRef.current,
                constraints: {
                  width: { min: 640, ideal: 1280, max: 1920 },
                  height: { min: 480, ideal: 720, max: 1080 },
                  facingMode: "environment", // Use back camera on mobile
                  aspectRatio: { ideal: 16/9 }
                },
                area: { // Define scanning area
                  top: "0%",
                  right: "0%",
                  left: "0%",
                  bottom: "0%"
                }
              },
              locator: {
                patchSize: "medium",
                halfSample: false, // Better quality
                showCanvas: false,
                showPatches: false,
                showFoundPatches: false,
                showSkeleton: false,
                showLabels: false,
                showPatchLabels: false,
                showBoundingBox: false,
                boxFromPatches: {
                  showTransformed: false,
                  showTransformedBox: false,
                  showBB: false
                }
              },
              numOfWorkers: 2, // Enable workers for better performance
              frequency: 10, // Scan frequency
              decoder: {
                readers: [
                  "code_128_reader",
                  "ean_reader",
                  "ean_8_reader",
                  "code_39_reader",
                  "code_39_vin_reader",
                  "codabar_reader",
                  "upc_reader",
                  "upc_e_reader",
                  "i2of5_reader"
                ],
                debug: {
                  drawBoundingBox: false,
                  showFrequency: false,
                  drawScanline: false,
                  showPattern: false
                },
                multiple: false
              },
              locate: true,
            },
            (err: any) => {
              if (err) {
                console.error("Quagga initialization error:", err);
                let errorMessage = "لا يمكن الوصول إلى الكاميرا.";
                if (err.message) {
                  if (err.message.includes("NotAllowedError") || err.message.includes("Permission")) {
                    errorMessage = "تم رفض الوصول إلى الكاميرا. الرجاء السماح بالوصول في إعدادات المتصفح.";
                  } else if (err.message.includes("NotFoundError") || err.message.includes("no camera")) {
                    errorMessage = "لم يتم العثور على كاميرا. الرجاء التأكد من وجود كاميرا متصلة.";
                  } else if (err.message.includes("NotReadableError")) {
                    errorMessage = "الكاميرا قيد الاستخدام من قبل تطبيق آخر.";
                  }
                }
                showToast(errorMessage, 'error');
                setIsScanning(false);
                onClose();
                return;
              }
              try {
                // Add onProcessed to verify scanning is working
                let processedCount = 0;
                Quagga.onProcessed((result: any) => {
                  processedCount++;
                  // Log every 30 frames to verify it's working
                  if (processedCount % 30 === 0) {
                    console.log("Quagga is processing frames...", processedCount);
                  }
                });

                Quagga.onDetected(detectionHandler);
                Quagga.start();
                
                console.log("Quagga started successfully");
                
                // Small delay to ensure everything is ready
                setTimeout(() => {
                  setIsScanning(true);
                }, 500);
              } catch (startErr) {
                console.error("Error starting Quagga:", startErr);
                showToast("خطأ في تشغيل الكاميرا.", 'error');
                setIsScanning(false);
                onClose();
              }
            }
          );
        } catch (err: any) {
          console.error("Error loading QuaggaJS:", err);
          showToast(err?.message || "حدث خطأ في تحميل قارئ الباركود.", 'error');
          setIsScanning(false);
          onClose();
        }
      };

      initializeScanner();
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
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
        <h3 className="text-xl font-bold text-center mb-2">
          مسح الباركود
        </h3>
        <p className="text-sm text-gray-600 text-center mb-4">
          وجه الكاميرا نحو الباركود واتركه في منتصف الإطار
        </p>
        <div className="relative w-full aspect-video bg-gray-900 rounded-md overflow-hidden">
          <div
            ref={scannerRef}
            className="w-full h-full"
            style={{ position: "relative" }}
          >
            {isScanning && (
              <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none z-10">
                <div className="w-11/12 h-2/3 border-4 border-green-500 rounded-lg opacity-90 shadow-lg"></div>
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-green-400 animate-scan opacity-80"></div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded">
                    ضع الباركود في منتصف الإطار
                  </p>
                </div>
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

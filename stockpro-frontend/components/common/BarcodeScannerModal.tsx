import React, { useEffect, useRef, useState } from 'react';
import { useToast } from './ToastProvider';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (barcodeValue: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const { showToast } = useToast();

    const stopScan = () => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
    };

    useEffect(() => {
        if (!isOpen) {
            stopScan();
            return;
        }

        const startScan = async () => {
            // @ts-ignore
            if (!('BarcodeDetector' in window)) {
                showToast('متصفحك لا يدعم قارئ الباركود.');
                onClose();
                return;
            }
            setIsScanning(true);
            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.onloadedmetadata = () => {
                       videoRef.current?.play();
                    };
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                showToast('لا يمكن الوصول إلى الكاميرا. الرجاء التحقق من الصلاحيات.');
                setIsScanning(false);
                onClose();
            }
        };

        startScan();

        return () => {
            stopScan();
        };
    }, [isOpen]);
    
    useEffect(() => {
        const detectBarcode = async () => {
            if (!videoRef.current || !isScanning || videoRef.current.readyState < 2) {
                return;
            }

            try {
                // @ts-ignore
                const barcodeDetector = new window.BarcodeDetector({ formats: ['ean_13', 'upc_a', 'code_128', 'qr_code'] });
                const barcodes = await barcodeDetector.detect(videoRef.current);

                if (barcodes.length > 0) {
                    onScanSuccess(barcodes[0].rawValue);
                    stopScan();
                    onClose();
                }
            } catch (err) {
                console.error("Barcode detection failed:", err);
                // Silently fail to avoid spamming user
            }
        };

        const scanLoop = () => {
            if (isScanning) {
                detectBarcode();
                animationFrameIdRef.current = requestAnimationFrame(scanLoop);
            }
        };
        
        if (isScanning) {
            // Start the loop only when the video is ready to play
            videoRef.current?.addEventListener('canplay', () => {
                if(!animationFrameIdRef.current) {
                    animationFrameIdRef.current = requestAnimationFrame(scanLoop);
                }
            });
        }

        return () => {
            if(animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
            }
        };
    }, [isScanning, onScanSuccess, onClose]);


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4 relative" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-center mb-4">وجه الكاميرا نحو الباركود</h3>
                <div className="relative w-full aspect-video bg-gray-900 rounded-md overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                    {isScanning && (
                         <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                            <div className="w-11/12 h-2/3 border-4 border-dashed border-gray-400 rounded-lg opacity-75"></div>
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-scan"></div>
                        </div>
                    )}
                     {!isScanning && (
                         <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50">
                            <p className="text-white text-lg">جاري تشغيل الكاميرا...</p>
                        </div>
                     )}
                </div>
                <button onClick={onClose} className="mt-4 w-full py-3 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700">
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
                `}</style>
            </div>
        </div>
    );
};

export default BarcodeScannerModal;
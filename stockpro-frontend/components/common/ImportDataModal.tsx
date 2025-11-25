
import React, { useState, useRef } from 'react';
import { UploadIcon, ExcelIcon, XIcon } from '../icons';
import { useToast } from './ToastProvider';
import {
  useImportItemsMutation,
  type ImportItemsSummary,
} from '../store/slices/items/itemsApi';

declare var XLSX: any;

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (summary: ImportItemsSummary) => void;
}

const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const [importItems, { isLoading }] = useImportItemsMutation();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleImport = async () => {
    if (!file) {
      showToast('الرجاء اختيار ملف أولاً');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const summary = (await importItems(formData).unwrap()) as ImportItemsSummary;
      setFile(null);
      onSuccess(summary);
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.error ||
        'حدث خطأ أثناء رفع الملف، يرجى المحاولة مرة أخرى';
      showToast(message, 'error');
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        الاسم: 'مثال صنف',
        المجموعة: 'عام',
        الوحدة: 'حبة',
        'سعر الشراء': 10,
        'سعر البيع': 15,
        الرصيد: 100,
        'حد الطلب': 10,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Items_Template.xlsx');
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
            <ExcelIcon className="w-6 h-6" />
            استيراد أصناف من Excel
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div
            className="border-2 border-dashed border-brand-blue rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors mb-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="w-12 h-12 text-brand-blue mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-700">
              اضغط لاختيار ملف أو اسحبه هنا
            </p>
            <p className="text-sm text-gray-500 mt-1">
              يدعم ملفات .xlsx, .xls (بحد أقصى 5MB)
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
          </div>

          {file && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4 flex items-center gap-3">
              <ExcelIcon className="w-6 h-6 text-green-600" />
              <span className="font-medium text-green-800 truncate">
                {file.name}
              </span>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 text-sm text-right text-gray-700 space-y-2 mb-4">
            <p className="font-semibold">يجب أن يحتوي الملف على الأعمدة التالية:</p>
            <ul className="list-disc list-inside space-y-1 pr-2">
              <li>الاسم</li>
              <li>المجموعة (مطابقة لاسم مجموعة موجودة)</li>
              <li>الوحدة (مطابقة لاسم وحدة موجودة)</li>
              <li>سعر الشراء</li>
              <li>سعر البيع</li>
              <li>الرصيد (الرصيد الافتتاحي)</li>
              <li>حد الطلب</li>
            </ul>
            <p className="text-xs text-gray-500">
              استخدم نموذج Excel الجاهز لضمان الترتيب الصحيح للأعمدة والقيم.
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={downloadTemplate}
              className="text-sm text-brand-blue hover:underline font-medium"
            >
              تحميل نموذج Excel
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={() => {
              setFile(null);
              onClose();
            }}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isLoading}
            className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'جاري الرفع...' : 'استيراد البيانات'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDataModal;

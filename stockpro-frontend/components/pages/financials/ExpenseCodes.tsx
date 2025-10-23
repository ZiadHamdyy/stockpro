import React, { useState } from 'react';
import type { ExpenseCode, ExpenseType } from '../../../types';
import { PrintIcon, SearchIcon } from '../../icons';
import ExpenseCodeModal from './ExpenseCodeModal.tsx';
import { useModal } from '../../common/ModalProvider.tsx';

interface ExpenseCodesProps {
    title: string;
    codes: ExpenseCode[];
    expenseTypes: ExpenseType[];
    onSave: (code: ExpenseCode) => void;
    onDelete: (id: number) => void;
}


const ExpenseCodes: React.FC<ExpenseCodesProps> = ({ title, codes, expenseTypes, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [codeToEdit, setCodeToEdit] = useState<ExpenseCode | null>(null);
    const { showModal } = useModal();

    const handleOpenModal = (code: ExpenseCode | null = null) => {
        setCodeToEdit(code);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCodeToEdit(null);
    };

    const handleEditClick = (code: ExpenseCode) => {
        showModal({
            title: 'تأكيد التعديل',
            message: 'هل أنت متأكد من رغبتك في تعديل بيانات هذا البند؟',
            onConfirm: () => handleOpenModal(code),
            type: 'edit',
            showPassword: true,
        });
    };

    const handleDeleteClick = (code: ExpenseCode) => {
        showModal({
            title: 'تأكيد الحذف',
            message: `هل أنت متأكد من حذف بند المصروف "${code.name}"؟`,
            onConfirm: () => onDelete(code.id),
            type: 'delete',
            showPassword: true,
        });
    };

    const inputStyle = "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow">
                <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
                <div className="flex justify-between items-center mb-6">
                    <div className="relative">
                        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                        <input type="text" placeholder="بحث عن بند..." className={inputStyle} />
                    </div>
                    <div>
                        <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 ml-2 font-semibold">اضافة بند جديد</button>
                        <button onClick={() => window.print()} className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                            <PrintIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-brand-blue">
                            <tr>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">كود البند</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">اسم البند</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">النوع</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">اجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {codes.map((code) => (
                                <tr key={code.id} className="hover:bg-brand-blue-bg">
                                    <td className="px-6 py-4 whitespace-nowrap">{code.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">{code.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{code.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleEditClick(code)} className="text-brand-blue hover:text-blue-800 font-semibold ml-4">تعديل</button>
                                        <button onClick={() => handleDeleteClick(code)} className="text-red-600 hover:text-red-900 font-semibold">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ExpenseCodeModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={onSave}
                codeToEdit={codeToEdit}
                expenseTypes={expenseTypes}
                codes={codes}
            />
        </>
    );
};

export default ExpenseCodes;
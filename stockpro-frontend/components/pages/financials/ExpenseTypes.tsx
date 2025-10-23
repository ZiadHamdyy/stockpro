import React, { useState } from 'react';
import type { ExpenseType } from '../../../types';
import { PrintIcon, SearchIcon } from '../../icons';
import ExpenseTypeModal from './ExpenseTypeModal.tsx';
import { useModal } from '../../common/ModalProvider.tsx';

interface ExpenseTypesProps {
    title: string;
    types: ExpenseType[];
    onSave: (type: ExpenseType) => void;
    onDelete: (id: number) => void;
}

const ExpenseTypes: React.FC<ExpenseTypesProps> = ({ title, types, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<ExpenseType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { showModal } = useModal();

    const handleOpenModal = (type: ExpenseType | null = null) => {
        setTypeToEdit(type);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTypeToEdit(null);
    };
    
    const handleEditClick = (type: ExpenseType) => {
        showModal({
            title: 'تأكيد التعديل',
            message: 'هل أنت متأكد من رغبتك في تعديل بيانات هذا النوع؟',
            onConfirm: () => handleOpenModal(type),
            type: 'edit',
            showPassword: true,
        });
    };

    const handleDeleteClick = (type: ExpenseType) => {
        showModal({
            title: 'تأكيد الحذف',
            message: `هل أنت متأكد من حذف النوع "${type.name}"؟`,
            onConfirm: () => onDelete(type.id),
            type: 'delete',
            showPassword: true,
        });
    };

    const filteredTypes = types.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputStyle = "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow">
                <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
                <div className="flex justify-between items-center mb-6">
                    <div className="relative">
                        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                        <input 
                            type="text" 
                            placeholder="بحث عن نوع..." 
                            className={inputStyle}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 ml-2 font-semibold">اضافة نوع جديد</button>
                        <button className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                            <PrintIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-brand-blue">
                            <tr>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">كود النوع</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">اسم النوع</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">اجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTypes.map((type) => (
                                <tr key={type.id} className="hover:bg-brand-blue-bg">
                                    <td className="px-6 py-4 whitespace-nowrap">{type.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">{type.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleEditClick(type)} className="text-brand-blue hover:text-blue-800 font-semibold ml-4">تعديل</button>
                                        <button onClick={() => handleDeleteClick(type)} className="text-red-600 hover:text-red-900 font-semibold">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ExpenseTypeModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={onSave}
                typeToEdit={typeToEdit}
            />
        </>
    );
};

export default ExpenseTypes;
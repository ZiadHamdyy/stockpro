import React, { useState } from 'react';
import type { Branch } from '../../../types';
import { PrintIcon, SearchIcon } from '../../icons';
import BranchModal from './BranchModal';
import { useModal } from '../../common/ModalProvider';

interface BranchesDataProps {
    title: string;
    branches: Branch[];
    onSave: (branch: Branch) => void;
    onDelete: (id: number) => void;
}

const BranchesData: React.FC<BranchesDataProps> = ({ title, branches, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { showModal } = useModal();

    const handleOpenModal = (branch: Branch | null = null) => {
        setBranchToEdit(branch);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setBranchToEdit(null);
    };

    const handleEditClick = (branch: Branch) => {
        showModal({
            title: 'تأكيد التعديل',
            message: 'هل أنت متأكد من رغبتك في تعديل بيانات هذا الفرع؟',
            onConfirm: () => {
                handleOpenModal(branch);
            },
            type: 'edit',
            showPassword: true,
        });
    };

    const handleDeleteClick = (branch: Branch) => {
        showModal({
            title: 'تأكيد الحذف',
            message: `هل أنت متأكد من حذف الفرع "${branch.name}"؟`,
            onConfirm: () => onDelete(branch.id),
            type: 'delete',
            showPassword: true,
        });
    };

    const filteredBranches = branches.filter(branch =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputStyle = "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow">
                <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
                <div className="flex justify-between items-center mb-6 no-print">
                    <div className="relative">
                        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                        <input 
                            type="text" 
                            placeholder="بحث عن فرع..." 
                            className={inputStyle} 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 ml-2 font-semibold">اضافة فرع جديد</button>
                        <button onClick={() => window.print()} className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                            <PrintIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-brand-blue">
                            <tr>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">كود الفرع</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">اسم الفرع</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">العنوان</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">الهاتف</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider no-print">اجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBranches.map((branch) => (
                                <tr key={branch.id} className="hover:bg-brand-blue-bg">
                                    <td className="px-6 py-4 whitespace-nowrap">{branch.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">{branch.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{branch.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{branch.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                                        <button onClick={() => handleEditClick(branch)} className="text-brand-blue hover:text-blue-800 font-semibold ml-4">تعديل</button>
                                        <button onClick={() => handleDeleteClick(branch)} className="text-red-600 hover:text-red-900 font-semibold">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <BranchModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={onSave}
                branchToEdit={branchToEdit}
            />
        </>
    );
};

export default BranchesData;
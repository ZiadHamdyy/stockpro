import React, { useState } from 'react';
import type { User, Branch } from '../../../types';
import { ExcelIcon, PdfIcon, PrintIcon, SearchIcon } from '../../icons';
import UserModal from './UserModal';
import { useModal } from '../../common/ModalProvider';
import { exportToExcel, exportToPdf } from '../../../utils/formatting';

interface UsersDataProps {
    title: string;
    users: User[];
    branches: Branch[];
    onSave: (user: User) => void;
    onDelete: (id: number) => void;
}

const UsersData: React.FC<UsersDataProps> = ({ title, users, branches, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { showModal } = useModal();

    const handleOpenModal = (user: User | null = null) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setUserToEdit(null);
    };

    const handleEditClick = (user: User) => {
        showModal({
            title: 'تأكيد التعديل',
            message: 'هل أنت متأكد من رغبتك في تعديل بيانات هذا المستخدم؟',
            onConfirm: () => {
                handleOpenModal(user);
            },
            type: 'edit',
            showPassword: true,
        });
    };

    const handleDeleteClick = (user: User) => {
        showModal({
            title: 'تأكيد الحذف',
            message: `هل أنت متأكد من حذف المستخدم "${user.fullName}"؟`,
            onConfirm: () => onDelete(user.id),
            type: 'delete',
            showPassword: true,
        });
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExcelExport = () => {
        const dataToExport = filteredUsers.map(({ id, fullName, username, permissionGroup, branch }) => ({
            'كود المستخدم': id,
            'الاسم الكامل': fullName,
            'اسم المستخدم': username,
            'مجموعة الصلاحيات': permissionGroup,
            'الفرع': branch,
        }));
        exportToExcel(dataToExport, 'قائمة-المستخدمين');
    };

    const handlePdfExport = () => {
        const head = [['الفرع', 'مجموعة الصلاحيات', 'اسم المستخدم', 'الاسم الكامل', 'كود المستخدم']];
        const body = filteredUsers.map(user => [
            user.branch,
            user.permissionGroup,
            user.username,
            user.fullName,
            user.id.toString(),
        ]);
        
        exportToPdf('قائمة المستخدمين', head, body, 'قائمة-المستخدمين');
    };

    const inputStyle = "w-64 pr-10 pl-4 py-3 bg-brand-blue-bg border-2 border-brand-blue rounded-md text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow">
                <h1 className="text-2xl font-bold mb-4 text-brand-dark">{title}</h1>
                <div className="flex justify-between items-center mb-4 no-print">
                    <div className="relative">
                        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                        <input 
                            type="text" 
                            placeholder="بحث عن مستخدم..." 
                            className={inputStyle} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenModal()} className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold">اضافة مستخدم جديد</button>
                        <button onClick={handleExcelExport} title="تصدير Excel" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                           <ExcelIcon className="w-6 h-6" />
                        </button>
                        <button onClick={handlePdfExport} title="تصدير PDF" className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                           <PdfIcon className="w-6 h-6" />
                        </button>
                        <button title="طباعة" onClick={() => window.print()} className="p-3 border-2 border-gray-200 rounded-md hover:bg-gray-100">
                            <PrintIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-brand-blue">
                            <tr>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">كود المستخدم</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">الاسم الكامل</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">اسم المستخدم</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">الرقم السري</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">مجموعة الصلاحيات</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider">الفرع</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-white uppercase tracking-wider no-print">اجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-brand-blue-bg">
                                    <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-brand-dark">{user.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">********</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.permissionGroup === 'مدير' ? 'bg-blue-100 text-brand-blue' : 'bg-green-100 text-green-800'}`}>
                                            {user.permissionGroup}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.branch}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                                        <button onClick={() => handleEditClick(user)} className="text-brand-blue hover:text-blue-800 font-semibold ml-4">تعديل</button>
                                        <button onClick={() => handleDeleteClick(user)} className="text-red-600 hover:text-red-900 font-semibold">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <UserModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={onSave}
                userToEdit={userToEdit}
                branches={branches}
            />
        </>
    );
};

export default UsersData;
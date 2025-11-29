
import React, { useState, useMemo } from 'react';
import type { AuditLogEntry } from '../../../types';
import { SearchIcon, ActivityIcon, UserIcon, ClockIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, TrashIcon, LockIcon, LogOutIcon, ShieldIcon } from '../../icons';
import { useGetAuditLogsQuery } from '../../store/slices/auditLog/auditLogApiSlice';
import { useGetUsersQuery } from '../../store/slices/user/userApi';
import { useGetBranchesQuery } from '../../store/slices/branch/branchApi';

interface AuditLogReportProps {
    title: string;
}

const AuditLogReport: React.FC<AuditLogReportProps> = ({ title }) => {
    const currentYear = new Date().getFullYear();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<string>('all');
    const [selectedAction, setSelectedAction] = useState<string>('all');
    const [selectedBranch, setSelectedBranch] = useState<string>('all');
    const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
    const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

    // Fetch data from API - fetch all logs, filter on frontend for better UX
    const { data: auditLogs = [], isLoading: logsLoading, error: logsError } = useGetAuditLogsQuery();

    const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();
    const { data: branches = [], isLoading: branchesLoading } = useGetBranchesQuery();

    const isLoading = logsLoading || usersLoading || branchesLoading;

    // Ensure auditLogs is an array
    const logsArray = Array.isArray(auditLogs) ? auditLogs : [];

    const filteredLogs = useMemo(() => {
        return logsArray.filter(log => {
            const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  log.targetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (log.targetId && log.targetId.toString().includes(searchTerm));
            const matchesUser = selectedUser === 'all' || log.userId.toString() === selectedUser;
            const matchesAction = selectedAction === 'all' || log.action === selectedAction;
            const matchesBranch = selectedBranch === 'all' || (log.branchName === selectedBranch);
            
            // Date filter (ignore time part for comparison)
            const logDate = log.timestamp.split('T')[0];
            const matchesDate = logDate >= startDate && logDate <= endDate;
            
            return matchesSearch && matchesUser && matchesAction && matchesBranch && matchesDate;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [logsArray, searchTerm, selectedUser, selectedAction, selectedBranch, startDate, endDate]);

    const getActionBadge = (action: string) => {
        const baseClasses = "px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2 border shadow-sm";
        switch (action) {
            case 'create': return <span className={`${baseClasses} bg-emerald-100 text-emerald-800 border-emerald-300`}><div className="w-2 h-2 rounded-full bg-emerald-600"></div>إضافة</span>;
            case 'update': return <span className={`${baseClasses} bg-blue-100 text-blue-800 border-blue-300`}><div className="w-2 h-2 rounded-full bg-blue-600"></div>تعديل</span>;
            case 'delete': return <span className={`${baseClasses} bg-red-100 text-red-800 border-red-300`}><TrashIcon className="w-3 h-3"/>حذف</span>;
            case 'login': return <span className={`${baseClasses} bg-purple-100 text-purple-800 border-purple-300`}><LockIcon className="w-3 h-3"/>دخول</span>;
            case 'logout': return <span className={`${baseClasses} bg-gray-200 text-gray-800 border-gray-300`}><LogOutIcon className="w-3 h-3"/>خروج</span>;
            case 'approve': return <span className={`${baseClasses} bg-teal-100 text-teal-800 border-teal-300`}><CheckCircleIcon className="w-3 h-3"/>اعتماد</span>;
            case 'reject': return <span className={`${baseClasses} bg-orange-100 text-orange-800 border-orange-300`}><XCircleIcon className="w-3 h-3"/>رفض</span>;
            default: return <span className={`${baseClasses} bg-gray-100 text-gray-800 border-gray-300`}><ActivityIcon className="w-3 h-3"/>{action}</span>;
        }
    };

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const logsToday = logsArray.filter(l => l.timestamp.startsWith(today)).length;
        const uniqueUsers = new Set(logsArray.map(l => l.userId)).size;
        
        return {
            total: logsArray.length,
            today: logsToday,
            users: uniqueUsers
        };
    }, [logsArray]);

    const inputStyle = "bg-white border-2 border-blue-200 text-gray-900 text-sm rounded-lg focus:ring-blue-800 focus:border-blue-800 block w-full p-2.5 placeholder-gray-500 shadow-sm transition-colors";

    if (isLoading) {
        return (
            <div className="flex flex-col h-full space-y-5 bg-slate-100 p-4 rounded-lg overflow-hidden">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                        <p className="text-gray-600">جاري تحميل البيانات...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (logsError) {
        return (
            <div className="flex flex-col h-full space-y-5 bg-slate-100 p-4 rounded-lg overflow-hidden">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <p className="text-red-600 text-lg font-semibold mb-2">حدث خطأ في تحميل البيانات</p>
                        <p className="text-gray-600">يرجى المحاولة مرة أخرى</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-5 bg-slate-100 p-4 rounded-lg overflow-hidden">
            
            {/* Top Stats Bar - Deep Royal Blue Gradient (Darker) */}
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 rounded-xl p-4 md:p-6 shadow-xl text-white relative overflow-hidden border border-blue-800 flex items-center">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform origin-bottom-right"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 w-full">
                    <div className="flex justify-center md:justify-start items-center gap-4">
                        <div className="p-3 bg-blue-800/50 rounded-lg border border-blue-700 backdrop-blur-sm shadow-inner">
                            <ShieldIcon className="w-8 h-8 text-blue-200" />
                        </div>
                        <div className="text-center md:text-right">
                            <h1 className="text-2xl font-bold tracking-wide text-white">{title}</h1>
                            <p className="text-blue-200 text-sm font-medium">نظام الرقابة وتتبع العمليات</p>
                        </div>
                    </div>
                    <div className="flex gap-8 bg-black/20 px-6 py-3 rounded-lg border border-blue-800/50 backdrop-blur-sm justify-center">
                        <div className="text-center">
                            <p className="text-blue-300 text-[10px] uppercase font-bold tracking-wider">إجمالي السجلات</p>
                            <p className="text-2xl font-mono font-bold text-white">{stats.total}</p>
                        </div>
                        <div className="w-px bg-white/10 h-10 self-center"></div>
                        <div className="text-center">
                            <p className="text-blue-300 text-[10px] uppercase font-bold tracking-wider">عمليات اليوم</p>
                            <p className="text-2xl font-mono font-bold text-emerald-400">{stats.today}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters - White Card with Stronger Borders */}
            <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-blue-900 flex flex-col xl:flex-row gap-4 items-center justify-between ring-1 ring-gray-200">
                <div className="relative w-full xl:w-1/3">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input 
                        type="text" 
                        className={`${inputStyle} pl-10`} 
                        placeholder="بحث في السجل (رقم، تفاصيل...)" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Filter Controls - All in One Line */}
                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                    {/* Date Range */}
                    <div className="flex items-center gap-1.5 bg-blue-50 p-1 rounded-lg border border-blue-200 shadow-sm">
                        <input 
                            type="date" 
                            className="bg-transparent text-blue-900 text-xs border-none focus:ring-0 px-1.5 py-1 outline-none font-semibold" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                        />
                        <span className="text-blue-400 text-xs font-bold">إلى</span>
                        <input 
                            type="date" 
                            className="bg-transparent text-blue-900 text-xs border-none focus:ring-0 px-1.5 py-1 outline-none font-semibold" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                        />
                    </div>
                    
                    {/* Branch Select */}
                    <select 
                        className={`${inputStyle} w-32 text-sm`} 
                        value={selectedBranch} 
                        onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                        <option value="all">كل الفروع</option>
                        {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>

                    {/* User Select */}
                    <select 
                        className={`${inputStyle} w-32 text-sm`} 
                        value={selectedUser} 
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <option value="all">كل المستخدمين</option>
                        {users.map(u => <option key={u.id} value={u.id.toString()}>{(u as any).fullName || u.name || u.email}</option>)}
                    </select>

                    {/* Action Select */}
                    <select 
                        className={`${inputStyle} w-32 text-sm`} 
                        value={selectedAction} 
                        onChange={(e) => setSelectedAction(e.target.value)}
                    >
                        <option value="all">كل العمليات</option>
                        <option value="create">إضافة</option>
                        <option value="update">تعديل</option>
                        <option value="delete">حذف</option>
                        <option value="approve">اعتماد</option>
                        <option value="reject">رفض</option>
                    </select>
                </div>
            </div>

            {/* Data Table - Deep Blue Headers */}
            <div className="flex-grow overflow-hidden rounded-xl border border-blue-200 bg-white shadow-md flex flex-col">
                <div className="overflow-y-auto flex-grow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-900 sticky top-0 z-10 shadow-md">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-blue-50 uppercase tracking-wider w-48 border-l border-blue-800">الوقت والتاريخ</th>
                                <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-blue-50 uppercase tracking-wider w-56 border-l border-blue-800">المستخدم</th>
                                <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-blue-50 uppercase tracking-wider w-40 border-l border-blue-800">الفرع</th>
                                <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-blue-50 uppercase tracking-wider w-32 border-l border-blue-800">النوع</th>
                                <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-blue-50 uppercase tracking-wider w-40 border-l border-blue-800">الهدف</th>
                                <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-blue-50 uppercase tracking-wider">التفاصيل</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLogs.map((log, index) => (
                                <tr key={log.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                    <td className="px-6 py-3 whitespace-nowrap border-l border-gray-100">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-blue-900 font-mono" dir="ltr">
                                                {new Date(log.timestamp).toLocaleDateString('en-GB')}
                                            </span>
                                            <span className="text-xs text-blue-500 font-mono flex items-center gap-1" dir="ltr">
                                                <ClockIcon className="w-3 h-3"/>
                                                {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap border-l border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-xs font-bold shadow-sm border border-blue-200">
                                                {log.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{log.userName}</div>
                                                <div className="text-xs text-gray-500 font-mono">ID: {log.userId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap border-l border-gray-100">
                                        <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 shadow-sm inline-block">
                                            {log.branchName || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap border-l border-gray-100">
                                        {getActionBadge(log.action)}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap border-l border-gray-100">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-800">{log.targetType}</span>
                                            {log.targetId && <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1 rounded w-fit border border-gray-200">#{log.targetId}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <p className="text-sm text-gray-700 font-medium truncate max-w-md" title={log.details}>
                                            {log.details}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center bg-white">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="p-4 bg-gray-100 rounded-full mb-3 border border-gray-200">
                                                <SearchIcon className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-lg font-semibold text-gray-600">لا توجد سجلات</p>
                                            <p className="text-sm opacity-70">لم يتم العثور على عمليات تطابق بحثك</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogReport;

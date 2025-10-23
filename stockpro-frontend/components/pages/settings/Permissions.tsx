import React, { useState, useEffect } from 'react';
import type { PermissionNode } from '../../../types';
import { MENU_ITEMS } from '../../../constants';
import { ChevronDownIcon, ChevronLeftIcon } from '../../icons';

const permissionRoles = ['مدير', 'محاسب', 'بائع', 'مدخل بيانات'];
const PERMISSION_ACTIONS = ['قراءة', 'جديد', 'تعديل', 'حذف', 'بحث', 'طباعة'];

const permissionTreeData: PermissionNode[] = MENU_ITEMS.map(item => ({
    key: item.key,
    label: item.label,
    children: item.children?.map(child => ({
         key: child.key,
         label: child.label,
         children: child.children?.map(subChild => ({
             key: subChild.key,
             label: subChild.label,
             children: subChild.children?.map(grandChild => ({
                key: grandChild.key,
                label: grandChild.label
             }))
         }))
    }))
}));

const getAllKeys = (nodes: PermissionNode[]): string[] => {
    return nodes.flatMap(node => [node.key, ...(node.children ? getAllKeys(node.children) : [])]);
};
const allItemKeys = getAllKeys(permissionTreeData);


// Helper to render the permission tree
const PermissionTree: React.FC<{ 
    node: PermissionNode;
    level?: number;
    permissions: Set<string>;
    onPermissionChange: (itemKey: string, action: string, isChecked: boolean) => void;
}> = ({ node, level = 0, permissions, onPermissionChange }) => {
    const [isOpen, setIsOpen] = useState(level < 1);
    const hasChildren = node.children && node.children.length > 0;
    const padding = level * 24;

    return (
        <div className="border-b last:border-b-0">
            <div 
                className={`grid grid-cols-7 items-center p-2 rounded-md ${hasChildren ? 'cursor-pointer' : ''} hover:bg-gray-200 transition-colors duration-150`}
                onClick={() => hasChildren && setIsOpen(!isOpen)}
            >
                <div className="col-span-2 flex items-center" style={{ paddingRight: `${padding}px` }}>
                    {hasChildren && (
                        isOpen 
                            ? <ChevronDownIcon className="w-4 h-4 ml-2 text-gray-600 flex-shrink-0" /> 
                            : <ChevronLeftIcon className="w-4 h-4 ml-2 text-gray-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-brand-dark">{node.label}</span>
                </div>
                 {PERMISSION_ACTIONS.map(action => (
                    <div key={action} className="text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                            type="checkbox" 
                            className="form-checkbox h-5 w-5 text-brand-blue rounded focus:ring-brand-blue border-gray-300 cursor-pointer"
                            checked={permissions.has(`${node.key}-${action}`)}
                            onChange={(e) => onPermissionChange(node.key, action, e.target.checked)}
                        />
                    </div>
                ))}
            </div>
            {isOpen && hasChildren && (
                <div>
                    {node.children?.map(child => <PermissionTree key={child.key} node={child} level={level + 1} permissions={permissions} onPermissionChange={onPermissionChange} />)}
                </div>
            )}
        </div>
    );
}

const Permissions: React.FC<{ title: string }> = ({ title }) => {
    const [selectedRole, setSelectedRole] = useState(permissionRoles[0]);
    const [permissions, setPermissions] = useState<Record<string, Set<string>>>({});

    useEffect(() => {
        // Initialize permissions for Manager role to have all permissions
        setPermissions(prev => {
            const adminPermissions = new Set<string>();
            allItemKeys.forEach(itemKey => {
                PERMISSION_ACTIONS.forEach(action => {
                    adminPermissions.add(`${itemKey}-${action}`);
                });
            });
            return { ...prev, 'مدير': adminPermissions };
        });
    }, []);

    const handlePermissionChange = (itemKey: string, action: string, isChecked: boolean) => {
        setPermissions(prev => {
            const newPermissions = { ...prev };
            const rolePermissions = new Set(newPermissions[selectedRole] || []);
            const permissionKey = `${itemKey}-${action}`;
            if (isChecked) {
                rolePermissions.add(permissionKey);
            } else {
                rolePermissions.delete(permissionKey);
            }
            newPermissions[selectedRole] = rolePermissions;
            return newPermissions;
        });
    };

    const handleSelectAllForAction = (action: string, isChecked: boolean) => {
        setPermissions(prev => {
            const newPermissions = { ...prev };
            const rolePermissions = new Set(newPermissions[selectedRole] || []);
            allItemKeys.forEach(itemKey => {
                const permissionKey = `${itemKey}-${action}`;
                if (isChecked) {
                    rolePermissions.add(permissionKey);
                } else {
                    rolePermissions.delete(permissionKey);
                }
            });
            newPermissions[selectedRole] = rolePermissions;
            return newPermissions;
        });
    };

    const isAllSelectedForAction = (action: string) => {
        const rolePermissions = permissions[selectedRole] || new Set();
        return allItemKeys.every(itemKey => rolePermissions.has(`${itemKey}-${action}`));
    };
    
    const selectStyle = "block w-full md:w-1/3 bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4";

    const currentPermissions = permissions[selectedRole] || new Set();

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2 text-brand-dark">{title}</h1>
            
            <div className="mb-4">
                 <label htmlFor="role-select" className="block text-sm font-medium text-gray-600 mb-1">
                    اختر مجموعة الصلاحيات
                </label>
                <select 
                    id="role-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className={selectStyle}
                >
                    {permissionRoles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
            </div>

            <div className="border-2 border-brand-blue rounded-md">
                <div className="grid grid-cols-7 items-center p-2 bg-brand-blue-bg font-bold border-b-2 border-brand-blue text-sm">
                    <div className="col-span-2">الشاشة</div>
                    {PERMISSION_ACTIONS.map(action => (
                        <div key={action} className="text-center flex flex-col items-center">
                            <span>{action}</span>
                            <input 
                                type="checkbox"
                                title={`اختيار الكل لـ ${action}`}
                                className="form-checkbox h-4 w-4 mt-1 cursor-pointer"
                                checked={isAllSelectedForAction(action)}
                                onChange={(e) => handleSelectAllForAction(action, e.target.checked)}
                             />
                        </div>
                    ))}
                </div>
                <div className="max-h-[60vh] overflow-y-auto bg-gray-50">
                    {permissionTreeData.map(node => 
                        <PermissionTree 
                            key={node.key} 
                            node={node} 
                            permissions={currentPermissions}
                            onPermissionChange={handlePermissionChange}
                        />
                    )}
                </div>
            </div>

            <div className="pt-4 border-t border-gray-200 mt-4">
                <button type="button" className="px-8 py-3 bg-brand-blue text-white rounded-md hover:bg-blue-800 font-semibold">
                    حفظ الصلاحيات
                </button>
            </div>
        </div>
    );
};

export default Permissions;
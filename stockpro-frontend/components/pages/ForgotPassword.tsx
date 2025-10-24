import React, { useState } from 'react';
import { useForgotPasswordMutation } from '../store/slices/auth/authApi';
import { useToast } from '../common/ToastProvider';

interface ForgotPasswordProps {
    onNavigate: (page: string, email?: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();
    const [forgotPassword] = useForgotPasswordMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            showToast('يرجى إدخال البريد الإلكتروني');
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword({ email }).unwrap();
            showToast('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
            onNavigate('verify-otp', email);
        } catch (error: any) {
            console.error('Forgot password error:', error);
            showToast('حدث خطأ في إرسال رمز التحقق');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-dark">
                        نسيت كلمة المرور؟
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            البريد الإلكتروني
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full bg-brand-blue-bg border-2 border-brand-blue rounded-md shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue py-3 px-4"
                            placeholder="أدخل بريدك الإلكتروني"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => onNavigate('login')}
                            className="text-brand-blue hover:text-blue-800 font-medium"
                        >
                            العودة لتسجيل الدخول
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;

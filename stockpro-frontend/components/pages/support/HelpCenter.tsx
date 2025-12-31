
import React, { useState } from 'react';
import { HelpIcon, PhoneIcon, WhatsappIcon, MailIcon, GlobeIcon, SearchIcon, DownloadIcon, ChevronDownIcon } from '../../icons';
import { useAuth } from '../../hook/Auth';
import { useGetCompanyQuery } from '../../store/slices/companyApiSlice';
import { useCreateSupportTicketMutation } from '../../store/slices/support/supportApi';
import { useToast } from '../../common/ToastProvider';

const extractBranchName = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.name || value.title || "";
  }
  return "";
};

const getUserBranchName = (user: any): string => {
  if (!user) return "";
  if (user.branchName) return user.branchName;
  return extractBranchName(user?.branch);
};

const HelpCenter: React.FC<{ title: string }> = ({ title }) => {
    const [faqOpen, setFaqOpen] = useState<number | null>(null);
    const { User } = useAuth();
    const { data: company } = useGetCompanyQuery();
    const [createSupportTicket, { isLoading: isSubmitting }] = useCreateSupportTicketMutation();
    const { showToast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        problemType: 'مشكلة تقنية',
        title: '',
        details: '',
    });

    const faqs = [
        { q: "كيف يمكنني تغيير كلمة المرور؟", a: "يمكنك تغيير كلمة المرور من خلال الذهاب إلى الإعدادات > بيانات المستخدمين، ثم اختيار المستخدم والضغط على تعديل." },
        { q: "كيف أقوم بعمل نسخة احتياطية؟", a: "من القائمة الجانبية، اذهب إلى الإعدادات > قاعدة البيانات > نسخة احتياطية. سيتم تحميل ملف SQL يحتوي على جميع بياناتك." },
        { q: "هل يدعم البرنامج الفاتورة الإلكترونية؟", a: "نعم، البرنامج يدعم الفاتورة الإلكترونية المتوافقة مع هيئة الزكاة والضريبة والجمارك (ZATCA) ويقوم بتوليد رمز QR مشفر." },
        { q: "كيف أضيف شعار شركتي؟", a: "من الإعدادات > بيانات الشركة، يمكنك رفع صورة الشعار التي ستظهر في جميع الفواتير والتقارير." },
        { q: "كيف يمكنني إضافة مستخدم جديد؟", a: "من قائمة الإعدادات، اختر 'بيانات المستخدمين' ثم اضغط على زر 'إضافة مستخدم جديد'. ستحتاج إلى تحديد الصلاحيات والفرع الخاص بالمستخدم." },
    ];

    const toggleFaq = (index: number) => {
        setFaqOpen(faqOpen === index ? null : index);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate form
        if (!formData.name.trim() || !formData.phone.trim() || !formData.title.trim() || !formData.details.trim()) {
            showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        try {
            await createSupportTicket({
                name: formData.name,
                phone: formData.phone,
                problemType: formData.problemType,
                title: formData.title,
                details: formData.details,
            }).unwrap();

            showToast('تم إرسال التذكرة بنجاح!', 'success');
            
            // Reset form
            setFormData({
                name: '',
                phone: '',
                problemType: 'مشكلة تقنية',
                title: '',
                details: '',
            });
        } catch (error: any) {
            console.error('Error submitting support ticket:', error);
            showToast(error?.data?.message || 'حدث خطأ أثناء إرسال التذكرة', 'error');
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center py-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10 pointer-events-none mix-blend-overlay"></div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-green-400 rounded-full blur-3xl opacity-20"></div>
                <div className="relative z-10">
                    <div className="bg-white/20 p-4 rounded-full inline-block mb-4 backdrop-blur-sm">
                        <HelpIcon className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-3">كيف يمكننا مساعدتك اليوم؟</h1>
                    <p className="text-cyan-100 mb-8 text-lg">فريق الدعم الفني جاهز للإجابة على استفساراتك وحل مشاكلك.</p>
                    
                    <div className="max-w-2xl mx-auto relative px-4">
                        <input 
                            type="text" 
                            placeholder="ابحث عن سؤال أو مشكلة..." 
                            className="w-full py-4 px-6 pr-12 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-cyan-300 shadow-xl text-lg placeholder-gray-400"
                        />
                        <SearchIcon className="absolute right-8 top-5 text-gray-400 w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Contact Channels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a href="https://wa.me/966552403483" target="_blank" rel="noreferrer" className="bg-green-50 border-b-4 border-green-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group cursor-pointer">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-white p-3 rounded-full shadow-sm group-hover:bg-green-100 transition-colors">
                            <WhatsappIcon className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-green-900">واتساب</h3>
                            <p className="text-xs text-green-600">أسرع طريقة للتواصل</p>
                        </div>
                    </div>
                    <p className="text-sm text-green-800 mb-4">تواصل معنا مباشرة عبر واتساب للحصول على ردود فورية خلال ساعات العمل.</p>
                    <span className="text-green-600 font-bold text-sm flex items-center">بدء المحادثة <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">&larr;</span></span>
                </a>

                <a href="tel:0552403483" className="bg-cyan-50 border-b-4 border-cyan-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group cursor-pointer">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-white p-3 rounded-full shadow-sm group-hover:bg-cyan-100 transition-colors">
                            <PhoneIcon className="w-8 h-8 text-cyan-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-cyan-900">اتصال هاتفي</h3>
                            <p className="text-xs text-cyan-600">9:00 ص - 5:00 م</p>
                        </div>
                    </div>
                    <p className="text-sm text-cyan-800 mb-4">تحدث مع أحد ممثلي خدمة العملاء لحل المشاكل المعقدة.</p>
                    <span className="text-cyan-600 font-bold text-sm flex items-center">0552403483</span>
                </a>

                <a href="mailto:support@stockpro.com" className="bg-blue-50 border-b-4 border-blue-500 p-6 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group cursor-pointer">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-white p-3 rounded-full shadow-sm group-hover:bg-blue-100 transition-colors">
                            <MailIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-blue-900">البريد الإلكتروني</h3>
                            <p className="text-xs text-blue-600">للطلبات غير العاجلة</p>
                        </div>
                    </div>
                    <p className="text-sm text-blue-800 mb-4">أرسل لنا تفاصيل مشكلتك وسنقوم بالرد عليك خلال 24 ساعة.</p>
                    <span className="text-blue-600 font-bold text-sm flex items-center">support@stockpro.com</span>
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Remote Support Tools */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow p-6 border-t-4 border-red-500">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <GlobeIcon className="w-6 h-6 text-red-500" />
                        المساعدة عن بعد
                    </h3>
                    <p className="text-red-800 text-sm mb-6 leading-relaxed bg-red-50 p-3 rounded-lg border border-red-100">
                        للسماح لموظف الدعم بالتحكم بجهازك وحل المشكلة، يرجى تحميل أحد البرامج التالية وتزويدنا برقم الهوية.
                    </p>
                    <div className="space-y-4">
                        <a href="https://anydesk.com/en/downloads" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all group bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold shadow-sm">A</div>
                                <div>
                                    <span className="font-bold text-gray-800 block">AnyDesk</span>
                                    <span className="text-xs text-gray-500">تحميل سريع</span>
                                </div>
                            </div>
                            <DownloadIcon className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                        </a>
                        <a href="https://www.teamviewer.com/en/download/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all group bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold shadow-sm">T</div>
                                <div>
                                    <span className="font-bold text-gray-800 block">TeamViewer</span>
                                    <span className="text-xs text-gray-500">النسخة الكاملة</span>
                                </div>
                            </div>
                            <DownloadIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </a>
                    </div>
                </div>

                {/* Ticket System */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow p-6 border-t-4 border-brand-blue">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
                        <div className="w-2 h-8 bg-brand-blue rounded-full"></div>
                        فتح تذكرة دعم جديدة
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-cyan-200 bg-cyan-50 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue focus:outline-none transition-shadow" 
                                    placeholder="اسمك الكامل" 
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                                <input 
                                    type="text" 
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-cyan-200 bg-cyan-50 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue focus:outline-none transition-shadow" 
                                    placeholder="05xxxxxxxx" 
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">نوع المشكلة</label>
                            <select 
                                name="problemType"
                                value={formData.problemType}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-cyan-200 bg-cyan-50 rounded-lg focus:ring-2 focus:ring-brand-blue focus:outline-none"
                                required
                            >
                                <option value="مشكلة تقنية">مشكلة تقنية</option>
                                <option value="استفسار مالي">استفسار مالي</option>
                                <option value="طلب ميزة جديدة">طلب ميزة جديدة</option>
                                <option value="أخرى">أخرى</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المشكلة</label>
                            <input 
                                type="text" 
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-cyan-200 bg-cyan-50 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue focus:outline-none transition-shadow" 
                                placeholder="ملخص قصير للمشكلة" 
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">التفاصيل</label>
                            <textarea 
                                rows={4} 
                                name="details"
                                value={formData.details}
                                onChange={handleInputChange}
                                className="w-full p-3 border border-cyan-200 bg-cyan-50 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue focus:outline-none transition-shadow" 
                                placeholder="يرجى وصف المشكلة بالتفصيل..."
                                required
                            ></textarea>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-10 py-3 bg-brand-blue text-white rounded-lg hover:bg-blue-800 font-bold shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال التذكرة'}</span>
                                <MailIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-6 border-b border-cyan-100 bg-cyan-50">
                    <h3 className="text-xl font-bold text-cyan-900 text-center">الأسئلة الشائعة</h3>
                </div>
                <div className="divide-y divide-cyan-100">
                    {faqs.map((faq, index) => (
                        <div key={index} className="group bg-white hover:bg-cyan-50 transition-colors">
                            <button 
                                onClick={() => toggleFaq(index)}
                                className="w-full flex justify-between items-center p-5 text-right focus:outline-none"
                            >
                                <span className={`font-semibold text-lg ${faqOpen === index ? 'text-brand-blue' : 'text-gray-700 group-hover:text-brand-blue'}`}>{faq.q}</span>
                                <ChevronDownIcon className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${faqOpen === index ? 'rotate-180 text-brand-blue' : ''}`} />
                            </button>
                            <div 
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${faqOpen === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="p-5 pt-0 text-gray-600 leading-relaxed bg-cyan-50/50 border-t border-cyan-100">
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;

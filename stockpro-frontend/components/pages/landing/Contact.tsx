import React from 'react';

const ContactPage: React.FC = () => {
  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-emerald-600 font-bold text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-100 to-blue-100 px-5 py-2 rounded-full border-2 border-emerald-200/50 shadow-md mb-4">
            تواصل معنا
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-emerald-600 to-purple-600 bg-clip-text text-transparent">
              هل لديك استفسار؟
            </span>
          </h2>
          <p className="mt-3 text-lg text-slate-700 font-medium">تواصل معنا الآن وسيقوم فريقنا بالرد عليك في أقرب وقت.</p>
        </div>
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-white to-blue-50/30 p-8 md:p-12 rounded-3xl shadow-2xl border-2 border-white/80">
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">الاسم</label>
              <input type="text" name="name" id="name" className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white" placeholder="اسمك الكامل" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
              <input type="email" name="email" id="email" className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white" placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-2">رسالتك</label>
              <textarea name="message" id="message" rows={5} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition bg-white" placeholder="اكتب استفسارك هنا..."></textarea>
            </div>
            <div className="text-center pt-4">
              <button type="submit" className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold py-4 px-16 rounded-xl hover:from-blue-700 hover:to-emerald-700 transition text-lg transform hover:scale-105 shadow-lg shadow-blue-300/50">
                إرسال
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
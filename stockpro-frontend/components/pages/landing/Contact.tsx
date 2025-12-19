import React from 'react';

const ContactPage: React.FC = () => {
  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-blue-50 to-slate-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-stock-dark-blue">هل لديك استفسار؟</h2>
          <p className="mt-3 text-lg text-gray-600">تواصل معنا الآن وسيقوم فريقنا بالرد عليك في أقرب وقت.</p>
        </div>
        <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-xl shadow-2xl">
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">الاسم</label>
              <input type="text" name="name" id="name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-stock-green focus:border-stock-green transition" placeholder="اسمك الكامل" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
              <input type="email" name="email" id="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-stock-green focus:border-stock-green transition" placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2">رسالتك</label>
              <textarea name="message" id="message" rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-stock-green focus:border-stock-green transition" placeholder="اكتب استفسارك هنا..."></textarea>
            </div>
            <div className="text-center pt-4">
              <button type="submit" className="bg-stock-green text-white font-bold py-3 px-16 rounded-lg hover:bg-green-700 transition text-lg transform hover:scale-105">
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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon, FacebookIcon, YoutubeIcon, GlobeIcon, PhoneIcon } from "../icons";
import { useLoginUserMutation } from "../store/slices/auth/authApi";
import ForgotPassword from "./ForgotPassword";
import VerifyOtp from "./VerifyOtp";
import ResetPassword from "./ResetPassword";

interface LoginProps {
  onLogin: (email: string, password: string, userData?: any) => void;
}

const StockProLogo: React.FC<{ size?: 'normal' | 'large', variant?: 'light' | 'dark' }> = ({ size = 'normal', variant = 'light' }) => {
    const isLarge = size === 'large';
    const svgSize = isLarge ? "80" : "48"; // Increased Logo Size for large variant
    const textSize = isLarge ? "text-6xl" : "text-3xl"; // Increased Text Size
    const textColor = variant === 'light' ? 'text-white' : 'text-brand-blue';
    const subTextColor = variant === 'light' ? 'text-blue-100' : 'text-gray-500';

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
                <svg width={svgSize} height={svgSize} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl filter">
                    <path d="M6 22.0001L13 26.0001L26 13.3334L19 9.33341L6 22.0001Z" fill="#A3E635"/>
                    <path d="M19 9.33325L26 13.3333L13 26L6 22L19 9.33325Z" stroke={variant === 'light' ? '#F9FAFB' : '#1E40AF'} strokeWidth="1.5"/>
                    <path d="M26 10L19 6L6 18.6666L13 22.6666L26 10Z" fill={variant === 'light' ? '#60A5FA' : '#1E40AF'} /> 
                    <path d="M13 22.6667L6 18.6667L19 6L26 10L13 22.6667Z" stroke={variant === 'light' ? '#F9FAFB' : '#1E40AF'} strokeWidth="1.5"/>
                </svg>
                <span className={`${textSize} font-black ${textColor} tracking-wider drop-shadow-lg`}>StockPro</span>
            </div>
            {isLarge && <span className={`text-lg font-medium ${subTextColor} tracking-[0.4em] uppercase mt-1 opacity-90`}>Inventory System</span>}
        </div>
    );
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState("login");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  const [loginUser, { isLoading }] = useLoginUserMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await loginUser({ email, password }).unwrap();
      // Call the parent onLogin callback with user data
      const userData = (result as any)?.data?.user;
      onLogin(email, password, userData);
      
      // Check if user is SUPER_ADMIN and redirect accordingly
      const isSuperAdmin = userData?.role?.name === 'SUPER_ADMIN';
      if (isSuperAdmin) {
        navigate("/subscription", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError("حدث خطأ أثناء تسجيل الدخول");
    }
  };

  const handleForgotPassword = () => {
    setCurrentPage("forgot-password");
  };

  const handleNavigate = (page: string, email?: string) => {
    if (page === "verify-otp") {
      setForgotPasswordEmail(email || "");
    }
    setCurrentPage(page);
  };

  // Render different pages based on current state
  if (currentPage === "forgot-password") {
    return <ForgotPassword onNavigate={handleNavigate} />;
  }

  if (currentPage === "verify-otp") {
    return (
      <VerifyOtp email={forgotPasswordEmail} onNavigate={handleNavigate} />
    );
  }

  if (currentPage === "reset-password") {
    return (
      <ResetPassword email={forgotPasswordEmail} onNavigate={handleNavigate} />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100 p-4 font-sans relative overflow-hidden">
      
      {/* Background Layer: More Saturated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-200 via-blue-200 to-emerald-200"></div>
      
      {/* Abstract Background Shapes (More Visible) */}
      <div className="absolute top-[-10%] right-[-5%] w-[900px] h-[900px] bg-blue-400/20 rounded-full blur-[80px] pointer-events-none mix-blend-multiply animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[900px] h-[900px] bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none mix-blend-multiply animate-pulse" style={{animationDelay: '2s'}}></div>

      {/* Main Card */}
      <div className="w-[95%] max-w-[1800px] h-[90vh] min-h-[700px] bg-white/90 rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col lg:flex-row z-10 border border-white/60 backdrop-blur-sm">
        
        {/* Left Side (Brand) - Deep Royal Blue */}
        <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-[#1e3a8a] via-[#172554] to-[#0f172a] relative items-center justify-center p-16 text-white overflow-hidden">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10" 
               style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
          </div>

          {/* Giant Watermark Logo (Background) */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
               <svg width="800" height="800" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow">
                  <path d="M6 22.0001L13 26.0001L26 13.3334L19 9.33341L6 22.0001Z" fill="currentColor"/>
                  <path d="M26 10L19 6L6 18.6666L13 22.6666L26 10Z" fill="currentColor"/>
              </svg>
          </div>
          
          {/* Glowing Orb behind logo */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"></div>
          
          <div className="relative z-10 text-center space-y-12 w-full max-w-2xl flex flex-col items-center">
            {/* Glassmorphism Logo Container */}
            <div className="bg-white/10 p-12 rounded-[3rem] backdrop-blur-md border border-white/20 shadow-2xl transform hover:scale-105 transition-transform duration-500 flex flex-col items-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <StockProLogo size="large" variant="light" />
            </div>

            <div className="space-y-6">
              <h2 className="text-5xl font-bold leading-tight tracking-tight drop-shadow-lg">الذكاء في <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">إدارة أعمالك</span></h2>
              <p className="text-blue-100 text-xl leading-relaxed opacity-90 font-light max-w-lg mx-auto">
                نظام متكامل يجمع بين القوة والبساطة لإدارة المخزون، المبيعات، والحسابات في مكان واحد.
              </p>
            </div>
          </div>
          
          <div className="absolute bottom-0 w-full flex justify-between px-10 py-6 text-blue-300/60 text-sm font-medium">
            <span>v2.5.0 Stable</span>
            <span>© StockPro Systems 2024</span>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full lg:w-[45%] flex flex-col justify-between bg-white relative">
          <div className="flex-1 flex flex-col justify-center px-12 md:px-24 py-16">
            <div className="lg:hidden mb-12 text-center">
              <StockProLogo size="normal" variant="dark" />
            </div>

            <div className="mb-10">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-3">مرحباً بعودتك 👋</h2>
              <div className="h-1.5 w-16 bg-brand-blue rounded-full mb-4"></div>
              <p className="text-gray-500 text-lg">سجل دخولك للمتابعة إلى لوحة التحكم.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-bold text-gray-700">البريد او اسم المستخدم</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-focus-within:text-brand-blue transition-colors">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-lg focus:ring-0 focus:border-brand-blue transition-all outline-none placeholder-gray-400 hover:bg-blue-50/50"
                    placeholder="البريد او اسم المستخدم"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-bold text-gray-700">كلمة المرور</label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-brand-blue hover:text-blue-700 font-semibold"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-focus-within:text-brand-blue transition-colors">
                    <LockIcon className="h-6 w-6" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-12 pl-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-lg focus:ring-0 focus:border-brand-blue transition-all outline-none placeholder-gray-400 hover:bg-blue-50/50"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 hover:text-brand-blue transition-colors cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOffIcon className="h-6 w-6" /> : <EyeIcon className="h-6 w-6" />}
                  </button>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-brand-blue to-blue-700 hover:from-blue-700 hover:to-brand-blue text-white font-bold text-xl rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 flex justify-center items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span>{isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Social Media Footer (Emerald Green Bar) */}
          <div className="bg-emerald-600 p-5 w-full mt-auto shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)] relative z-20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4 md:px-8">
              <span className="text-white font-bold text-sm whitespace-nowrap tracking-wide opacity-90">تواصل معنا:</span>
              <div className="flex justify-center gap-4">
                <a href="#" className="bg-white hover:bg-blue-50 p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1 w-10 h-10 flex items-center justify-center group" title="Facebook">
                  <FacebookIcon className="w-5 h-5 text-[#1877F2]" />
                </a>
                <a href="#" className="bg-white hover:bg-red-50 p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1 w-10 h-10 flex items-center justify-center group" title="YouTube">
                  <YoutubeIcon className="w-5 h-5 text-[#FF0000]" />
                </a>
                <a href="#" className="bg-white hover:bg-cyan-50 p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1 w-10 h-10 flex items-center justify-center group" title="Website">
                  <GlobeIcon className="w-5 h-5 text-[#00A4EF]" />
                </a>
                <a href="#" className="bg-white hover:bg-green-50 p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1 w-10 h-10 flex items-center justify-center group" title="Contact">
                  <PhoneIcon className="w-5 h-5 text-[#25D366]" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .animate-spin-slow {
          animation: spin 20s linear infinite;
        }
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;

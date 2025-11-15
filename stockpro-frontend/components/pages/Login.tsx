import { useState } from "react";
import { UserIcon, LockIcon } from "../icons";
import { useLoginUserMutation } from "../store/slices/auth/authApi";
import ForgotPassword from "./ForgotPassword";
import VerifyOtp from "./VerifyOtp";
import ResetPassword from "./ResetPassword";

interface LoginProps {
  onLogin: (email: string, password: string, userData?: any) => void;
}

const StockProLogo: React.FC<{
  size?: "normal" | "large";
  textColorClass?: string;
}> = ({ size = "normal", textColorClass = "text-white" }) => {
  const isLarge = size === "large";
  const svgSize = isLarge ? "48" : "32";
  const textSize = isLarge ? "text-4xl" : "text-2xl";

  return (
    <div className="flex items-center gap-3">
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 22.0001L13 26.0001L26 13.3334L19 9.33341L6 22.0001Z"
          fill="#A3E635"
        />
        <path
          d="M19 9.33325L26 13.3333L13 26L6 22L19 9.33325Z"
          stroke="#F9FAFB"
          strokeWidth="1.5"
        />
        <path d="M26 10L19 6L6 18.6666L13 22.6666L26 10Z" fill="#1E40AF" />
        <path
          d="M13 22.6667L6 18.6667L19 6L26 10L13 22.6667Z"
          stroke="#F9FAFB"
          strokeWidth="1.5"
        />
      </svg>
      <span className={`${textSize} font-bold ${textColorClass}`}>
        StockPro
      </span>
    </div>
  );
};

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      onLogin(email, password, (result as any)?.data?.user);
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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-brand-blue to-blue-900 items-center justify-center p-12 text-white text-center relative">
        <div className="absolute top-0 right-0 bottom-0 left-0 bg-black opacity-20"></div>
        <div className="z-10">
          <StockProLogo size="large" />
          <h1 className="text-3xl font-bold mt-6">مرحباً بك في StockPro</h1>
          <p className="mt-2 text-lg text-blue-200">
            النظام المتقدم والاحترافي لإدارة المخزون والمبيعات والمشتريات.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8 lg:hidden">
            <StockProLogo size="large" textColorClass="text-brand-blue" />
          </div>
          <h2 className="text-3xl font-bold text-center text-brand-dark mb-2">
            تسجيل الدخول
          </h2>
          <p className="text-center text-gray-500 mb-8">
            أدخل البريد الإلكتروني وكلمة المرور للوصول لحسابك
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                البريد الإلكتروني
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-white border-2 border-gray-300 rounded-md text-brand-blue placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  كلمة المرور
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-brand-blue hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <LockIcon className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 bg-white border-2 border-gray-300 rounded-md text-brand-blue placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brand-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </button>
            </div>
          </form>

          <p className="mt-12 text-center text-sm text-gray-500">
            &copy; 2024 StockPro. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

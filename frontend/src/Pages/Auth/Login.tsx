import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthSidebar from '../../components/auth/AuthSidebar';
import InputField from '../../components/ui/InputField';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = 'Required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!formData.password) {
      newErrors.password = 'Required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setLoading(true);
      const user = await login(formData);
      
      showNotification('Welcome back! Login successful.', 'success');
      
      const role = user.role;
      const dashboardMap: Record<string, string> = {
        super_admin: '/super-admin/dashboard',
        school_admin: '/admin/dashboard',
        teacher: '/teacher/dashboard',
        student: '/student/dashboard',
        parent: '/parent/dashboard',
        accountant: '/accountant/dashboard'
      };
      
      navigate(dashboardMap[role] || '/admin/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white font-body overflow-hidden">
      
      {/* SHARED SIDEBAR */}
      <AuthSidebar />

      {/* RIGHT CONTENT - White Area */}
      <div className="flex-1 lg:w-[40%] flex flex-col px-8 md:px-16 py-6 overflow-hidden bg-white">
        {/* Header Link */}
        <div className="flex justify-end mb-12">
          <p className="text-[#133257]/50 text-xs">
            Don't have an account? 
            <Link to="/register" className="text-[#133257] font-bold ml-1 hover:underline">Sign Up</Link>
          </p>
        </div>

        {/* Form Area */}
        <div className="max-w-[400px] mx-auto w-full flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-[#133257] text-4xl font-bold mb-2">Welcome Back</h3>
            <p className="text-[#133257]/50 text-sm leading-relaxed">
              Sign in to your school portal
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <InputField 
              label="Email Address" 
              placeholder="Enter your email" 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              icon="alternate_email" 
              error={errors.email}
            />
            
            <div className="space-y-1.5">
              <InputField 
                label="Password" 
                placeholder="Enter your password" 
                type={showPassword ? 'text' : 'password'} 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                icon="lock_open" 
                onToggleEye={() => setShowPassword(!showPassword)}
                error={errors.password}
              />
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-[#133257]/60 hover:text-[#133257] font-medium">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-[#133257]/30 text-[#133257] focus:ring-[#133257]" />
              <label htmlFor="remember" className="text-xs text-[#133257]/60 font-medium cursor-pointer">Remember me</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 bg-[#133257] hover:bg-[#133257]/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-[#133257]/20 mt-6 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Copyright */}
          <div className="mt-auto pt-12 text-center">
            <p className="text-[#133257]/30 text-[10px] font-medium uppercase tracking-wider">
              © 2024 EduManage SMS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

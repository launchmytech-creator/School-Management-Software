import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthSidebar from '../../components/auth/AuthSidebar';
import InputField from '../../components/ui/InputField';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

// --- Main Page Component ---

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
      
      // Redirect based on role
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
    <div className="flex h-screen w-full bg-white font-body overflow-hidden selection:bg-accent/20">
      
      {/* SHARED SIDEBAR */}
      <AuthSidebar />

      {/* RIGHT CONTENT */}
      <div className="flex-1 lg:w-[40%] flex flex-col px-8 md:px-16 py-6 overflow-hidden">
        {/* Header Link */}
        <div className="flex justify-end mb-8">
          <p className="text-slate-400 text-xs">
            Don't have an account? 
            <Link to="/register" className="text-accent font-bold ml-1 hover:underline">Sign Up</Link>
          </p>
        </div>

        {/* Form Area */}
        <div className="max-w-[400px] mx-auto w-full flex-1 flex flex-col justify-center">
          <h3 className="text-slate-900 text-3xl font-display font-bold mb-1 flex items-center gap-2">
            Welcome Back 👋
          </h3>
          <p className="text-slate-400 text-sm mb-10 leading-relaxed">
            Sign in to your school portal. Your role will be detected automatically.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <InputField 
              label="Email Address" 
              placeholder="example@edumanage.com" 
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
                placeholder="••••••••" 
                type={showPassword ? 'text' : 'password'} 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                icon="lock_open" 
                onToggleEye={() => setShowPassword(!showPassword)}
                error={errors.password}
              />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-accent focus:ring-accent transition-all" id="remember" />
                  <label htmlFor="remember" className="text-[10px] text-slate-500 font-medium cursor-pointer">Remember me</label>
                </div>
                <Link to="/forgot-password" title="Forgot Password?" className="text-[10px] text-accent font-bold hover:underline">Forgot Password?</Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-11 bg-accent hover:bg-accent/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-accent/25 transition-all transform active:scale-[0.98] mt-8 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing In...' : 'Sign In'}
              {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
            </button>
          </form>

          {/* Copyright */}
          <div className="mt-auto pt-16 text-center">
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
              © 2024 EDUMANAGE SMS. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

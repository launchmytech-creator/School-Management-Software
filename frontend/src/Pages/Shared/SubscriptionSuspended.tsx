import { Link } from 'react-router-dom';

const SubscriptionSuspended = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-red-500">block</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-800">Access Suspended</h1>
      <p className="text-slate-500 text-sm leading-relaxed">
        Your school&apos;s subscription has been suspended. Please contact your school administrator or our support team for assistance.
      </p>
      <div className="pt-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 h-12 px-8 bg-[#4A9FD4] text-white font-bold rounded-xl hover:bg-[#4A9FD4]/90 transition-all text-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Login
        </Link>
      </div>
    </div>
  </div>
);

export default SubscriptionSuspended;

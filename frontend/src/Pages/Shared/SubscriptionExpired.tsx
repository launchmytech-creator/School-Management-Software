import { Link } from 'react-router-dom';

const SubscriptionExpired = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-amber-500">schedule</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-800">Subscription Expired</h1>
      <p className="text-slate-500 text-sm leading-relaxed">
        Your school&apos;s subscription has expired. Please purchase a new subscription plan to regain access to the system.
      </p>
      <div className="pt-4 flex flex-col gap-3">
        <Link
          to="/admin/profile"
          className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-[#4A9FD4] text-white font-bold rounded-xl hover:bg-[#4A9FD4]/90 transition-all text-sm"
        >
          <span className="material-symbols-outlined text-lg">workspace_premium</span>
          View Plans
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 h-12 px-8 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Login
        </Link>
      </div>
    </div>
  </div>
);

export default SubscriptionExpired;

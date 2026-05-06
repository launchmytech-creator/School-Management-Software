import React, { useState, useMemo } from 'react';

interface PaymentHistoryTabProps {
  payments: Record<string, unknown>[];
  isLoading: boolean;
}

const PaymentHistoryTab: React.FC<PaymentHistoryTabProps> = ({ payments, isLoading }) => {
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const paymentDate = payment.payment_date as string;
      const matchesDate = !dateFilter || (paymentDate && paymentDate.startsWith(dateFilter));
      const status = (payment.status as string) || 'completed';
      const matchesStatus = !statusFilter || status.toLowerCase() === statusFilter.toLowerCase();
      return matchesDate && matchesStatus;
    });
  }, [payments, dateFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
            Filter by Date
          </label>
          <input
            type="month"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm font-medium"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm font-bold cursor-pointer"
          >
            <option value="">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        {(dateFilter || statusFilter) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFilter('');
                setStatusFilter('');
              }}
              className="h-12 px-6 rounded-xl border border-primary text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">receipt_long</span>
          <p className="text-sm font-bold text-slate-400">No payment history found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-100">
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee Term</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPayments.map((payment, index) => {
                  const amount = Number(payment.amount) || 0;
                  const status = ((payment.status as string) || 'completed').toLowerCase();
                  return (
                    <tr key={String(payment.id) || index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-medium text-slate-700">
                        {payment.payment_date ? new Date(payment.payment_date as string).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-slate-700">
                        {(payment.plan_name as string) || 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
                          {(payment.fee_term as string) || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-black text-[#1E3A5F]">
                        ₹{amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-700 capitalize">
                        {(payment.payment_mode as string) || 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-sm font-mono text-slate-500">
                        {(payment.transaction_reference as string) || '-'}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-md tracking-wider uppercase ${
                          status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-slate-500">
                        {payment.subscription_start_date && payment.subscription_end_date
                          ? `${new Date(payment.subscription_start_date as string).toLocaleDateString()} - ${new Date(payment.subscription_end_date as string).toLocaleDateString()}`
                          : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm font-black text-[#1E3A5F]">
              Total: ₹{filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryTab;

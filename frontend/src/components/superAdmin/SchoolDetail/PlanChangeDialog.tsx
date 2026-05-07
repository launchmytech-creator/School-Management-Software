import React, { useState, useMemo } from 'react';

interface PlanPricing {
  yearly: number;
  halfYearly: number;
  quarterly: number;
  monthly: number;
}

interface PlanChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  currentPlanId: number;
  currentPlanName: string;
  selectedPlanId: number | null;
  selectedPlanName: string;
  selectedPlanPricing: PlanPricing;
  subscriptionEndDate: string | undefined;
  onConfirm: (data: { planId: number; feeTerm: string; feeTermNumeric: number; paymentMode: string }) => void;
  isCalculating: boolean;
  calculationResult: {
    originalAmount: number;
    creditApplied: number;
    existingCreditUsed: number;
    totalCreditApplied: number;
    payableAmount: number;
    remainingDays: number;
    newPlanName: string;
    currentPlanName: string;
    feeTerm: string;
    newEndDate: string;
  } | null;
  onCalculate: (planId: number, feeTerm: string) => void;
}

const PLAN_TIER: Record<string, number> = {
  basic: 1,
  premium: 2,
  business: 3,
};

const PlanChangeDialog: React.FC<PlanChangeDialogProps> = ({
  isOpen,
  onClose,
  currentPlanName,
  selectedPlanId,
  selectedPlanName,
  selectedPlanPricing,
  subscriptionEndDate,
  onConfirm,
  isCalculating,
  calculationResult,
  onCalculate,
}) => {
  const [feeTerm, setFeeTerm] = useState('yearly');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [transactionRef, setTransactionRef] = useState('');

  const isDowngrade = useMemo(() => {
    const currentTier = PLAN_TIER[currentPlanName.toLowerCase()] || 0;
    const selectedTier = PLAN_TIER[selectedPlanName.toLowerCase()] || 0;
    return selectedTier < currentTier;
  }, [currentPlanName, selectedPlanName]);

  const handleCalculate = () => {
    onCalculate(selectedPlanId!, feeTerm);
  };

  const handleConfirm = () => {
    onConfirm({
      planId: selectedPlanId!,
      feeTerm,
      paymentMode,
    });
  };

  const feeTermOptions = [
    { value: 'yearly', label: 'Yearly', price: selectedPlanPricing.yearly },
    { value: 'half-yearly', label: 'Half-Yearly', price: selectedPlanPricing.halfYearly },
    { value: 'quarterly', label: 'Quarterly', price: selectedPlanPricing.quarterly },
    { value: 'monthly', label: 'Monthly', price: selectedPlanPricing.monthly },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-[#1E3A5F]">
              {isDowngrade ? 'Schedule Downgrade' : 'Change Subscription Plan'}
            </h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-slate-400">close</span>
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Plan</p>
                <p className="text-lg font-bold text-slate-700">{currentPlanName}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300">arrow_forward</span>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Plan</p>
                <p className="text-lg font-bold text-[#4A9FD4]">{selectedPlanName}</p>
              </div>
            </div>
          </div>

          {isDowngrade ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">schedule</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">Downgrade Will Be Scheduled</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Your current <strong>{currentPlanName}</strong> plan continues until{' '}
                      <strong>{subscriptionEndDate ? new Date(subscriptionEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'the end of your billing cycle'}</strong>.
                      The <strong>{selectedPlanName}</strong> plan will take effect after that date.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Payment Frequency for New Plan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {feeTermOptions.filter(term => term.price > 0).map((term) => (
                    <button
                      key={term.value}
                      type="button"
                      onClick={() => setFeeTerm(term.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        feeTerm === term.value
                          ? 'border-[#4A9FD4] bg-[#4A9FD4]/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-700">{term.label}</p>
                      <p className="text-sm font-black text-[#1E3A5F]">₹{Math.round(term.price).toLocaleString('en-IN')}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-xl border-2 border-primary/20 text-primary font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 h-12 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all cursor-pointer"
                >
                  Schedule Downgrade
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Payment Frequency
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {feeTermOptions.filter(term => term.price > 0).map((term) => (
                    <button
                      key={term.value}
                      type="button"
                      onClick={() => setFeeTerm(term.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        feeTerm === term.value
                          ? 'border-[#4A9FD4] bg-[#4A9FD4]/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-700">{term.label}</p>
                      <p className="text-sm font-black text-[#1E3A5F]">₹{Math.round(term.price).toLocaleString('en-IN')}</p>
                    </button>
                  ))}
                </div>
              </div>

              {!calculationResult && (
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="w-full h-12 rounded-xl bg-[#4A9FD4] text-white font-bold text-sm hover:bg-[#4A9FD4]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isCalculating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    'Calculate Pricing'
                  )}
                </button>
              )}

              {calculationResult && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Pricing Breakdown</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">New plan cost ({feeTerm})</span>
                        <span className="font-bold">₹{calculationResult.originalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      {calculationResult.creditApplied > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Remaining days credit</span>
                          <span className="font-bold">-₹{calculationResult.creditApplied.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {calculationResult.existingCreditUsed > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Existing credit used</span>
                          <span className="font-bold">-₹{calculationResult.existingCreditUsed.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <hr className="border-emerald-200" />
                      <div className="flex justify-between text-base font-black text-[#1E3A5F]">
                        <span>Amount to Pay</span>
                        <span>₹{calculationResult.payableAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold">
                      New subscription ends: {new Date(calculationResult.newEndDate).toLocaleDateString()}
                      {calculationResult.remainingDays > 0 && ` (${calculationResult.remainingDays} days)`}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm font-bold cursor-pointer"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="online">Online Payment</option>
                    </select>
                  </div>

                  {(paymentMode === 'bank_transfer' || paymentMode === 'online') && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Transaction Reference
                      </label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. TXN123456"
                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary text-sm font-medium"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-12 rounded-xl border-2 border-primary/20 text-primary font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="flex-1 h-12 rounded-xl bg-[#4A9FD4] text-white font-bold text-sm hover:bg-[#4A9FD4]/90 transition-all cursor-pointer"
                    >
                      Confirm & Pay ₹{calculationResult.payableAmount.toLocaleString('en-IN')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanChangeDialog;

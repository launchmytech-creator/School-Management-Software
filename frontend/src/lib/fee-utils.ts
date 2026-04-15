import type { FeeTransaction } from "../services/feeService";

export interface FeeSummary {
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  paidPercentage: number;
}

export function computeFeeSummary(
  transactions: FeeTransaction[],
  amountField: "originalAmount" | "amountDue" = "originalAmount"
): FeeSummary {
  const totalAmount = transactions.reduce(
    (sum, t) => sum + (t[amountField] || 0),
    0
  );
  const totalPaid = transactions.reduce(
    (sum, t) => sum + (t.amountPaid || 0),
    0
  );
  const totalPending = transactions.reduce(
    (sum, t) => sum + (t.amountPending || 0),
    0
  );
  const paidPercentage =
    totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  return { totalAmount, totalPaid, totalPending, paidPercentage };
}

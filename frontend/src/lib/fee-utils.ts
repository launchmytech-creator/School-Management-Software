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

export function formatINR(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return '₹' + new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(num);
}

export interface ReceiptData {
  receiptNumber?: string | null;
  studentName: string;
  className?: string;
  termNumber?: number | null;
  feeType?: string | null;
  amountDue: number;
  amountPaid: number;
  amountPending: number;
  paymentDate?: string | null;
  paymentMode?: string | null;
  dueDate?: string | null | undefined;
  academicYearName?: string | null;
}

export function generateReceiptHtml(receipt: ReceiptData, schoolName: string = 'School'): string {
  const fmtDate = (d?: string | null) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt #${receipt.receiptNumber || 'N/A'}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; font-size: 13px; color: #1e293b; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 900; }
        .header p { margin: 5px 0; color: #64748b; }
        .details { margin-bottom: 30px; }
        .details table { width: 100%; border-collapse: collapse; }
        .details td { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .details td:first-child { font-weight: 600; width: 40%; color: #64748b; }
        .amount-section { margin: 20px 0; padding: 16px; background: #f8fafc; border-radius: 8px; }
        .amount-row { display: flex; justify-content: space-between; padding: 6px 0; }
        .amount-row.total { font-size: 18px; font-weight: 700; border-top: 2px solid #e2e8f0; margin-top: 10px; padding-top: 10px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        .status.paid { background: #d1fae5; color: #065f46; }
        .status.partial { background: #dbeafe; color: #1e40af; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${schoolName}</h1>
        <p>Fee Receipt</p>
      </div>
      <div class="details">
        <table>
          <tr><td>Receipt No.</td><td>${receipt.receiptNumber || '—'}</td></tr>
          <tr><td>Student Name</td><td>${receipt.studentName || 'N/A'}</td></tr>
          <tr><td>Class</td><td>${receipt.className || 'N/A'}</td></tr>
          <tr><td>Term</td><td>${receipt.termNumber ? `Term ${receipt.termNumber}` : 'Fee'}</td></tr>
          <tr><td>Academic Year</td><td>${receipt.academicYearName || 'N/A'}</td></tr>
          <tr><td>Due Date</td><td>${fmtDate(receipt.dueDate)}</td></tr>
        </table>
      </div>
      <div class="amount-section">
        <div class="amount-row"><span>Fee Amount</span><span>${formatINR(receipt.amountDue)}</span></div>
        <div class="amount-row"><span>Amount Paid</span><span>${formatINR(receipt.amountPaid)}</span></div>
        <div class="amount-row total"><span>Balance</span><span>${formatINR(receipt.amountPending)}</span></div>
      </div>
      ${receipt.paymentDate ? `
      <div class="details">
        <table>
          <tr><td>Payment Date</td><td>${fmtDate(receipt.paymentDate)}</td></tr>
          ${receipt.paymentMode ? `<tr><td>Payment Mode</td><td>${receipt.paymentMode.replace(/_/g, ' ')}</td></tr>` : ''}
        </table>
      </div>
      ` : ''}
      <div class="footer">
        <p>Thank you for your payment!</p>
        <p>Generated on ${new Date().toLocaleDateString('en-IN')}</p>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;
}

export function printReceipt(receipt: ReceiptData, schoolName: string = 'School'): void {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;
  
  printWindow.document.write(generateReceiptHtml(receipt, schoolName));
  printWindow.document.close();
}

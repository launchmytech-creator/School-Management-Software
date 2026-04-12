import React from "react";
import { BaseModal } from "../common/BaseModal";
import { Button } from "../ui/button";
import { Printer, Download } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import type { FeeTransaction } from "../../services/feeService";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FeeTransaction | null;
  studentName: string;
  academicYearName: string;
  schoolName: string;
}

const formatDisplayDate = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatPaymentMode = (mode: string | null): string => {
  if (!mode) return "-";
  return mode.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatPdfCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return "Rs. 0";
  return `Rs. ${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 15,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  receiptInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  receiptNo: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  receiptValue: {
    fontSize: 11,
    fontFamily: "Courier",
    color: "#1e293b",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  label: {
    fontSize: 10,
    color: "#64748b",
  },
  value: {
    fontSize: 10,
    fontWeight: "medium",
    color: "#1e293b",
  },
  monoValue: {
    fontSize: 10,
    fontFamily: "Courier",
    color: "#1e293b",
  },
  boldValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e293b",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableCell: {
    fontSize: 10,
    color: "#475569",
    textTransform: "capitalize",
  },
  tableCellAmount: {
    fontSize: 10,
    color: "#1e293b",
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 9,
    color: "#94a3b8",
    fontStyle: "italic",
  },
});

interface ReceiptPDFProps {
  transaction: FeeTransaction;
  studentName: string;
  academicYearName: string;
  schoolName: string;
}

const ReceiptPDF: React.FC<ReceiptPDFProps> = ({
  transaction,
  studentName,
  academicYearName,
  schoolName,
}) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.schoolName}>
          {schoolName || "School Name"}
        </Text>
        <Text style={pdfStyles.subtitle}>Fee Receipt</Text>
      </View>

      <View style={pdfStyles.receiptInfo}>
        <View>
          <Text style={pdfStyles.receiptNo}>Receipt No.</Text>
          <Text style={pdfStyles.receiptValue}>
            {transaction.receiptNumber || "-"}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={pdfStyles.receiptNo}>Date</Text>
          <Text style={pdfStyles.value}>
            {formatDisplayDate(transaction.paymentDate)}
          </Text>
        </View>
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Student Information</Text>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Student</Text>
          <Text style={pdfStyles.value}>{studentName}</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Admission No.</Text>
          <Text style={pdfStyles.monoValue}>
            {transaction.admissionNumber}
          </Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Class</Text>
          <Text style={pdfStyles.value}>
            {transaction.className}
            {transaction.classSection
              ? ` - Section ${transaction.classSection}`
              : ""}
          </Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Academic Year</Text>
          <Text style={pdfStyles.value}>{academicYearName}</Text>
        </View>
        {transaction.termNumber && (
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Term</Text>
            <Text style={pdfStyles.value}>
              Term {transaction.termNumber}
            </Text>
          </View>
        )}
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Payment Summary</Text>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Total Amount</Text>
          <Text style={pdfStyles.value}>
            {formatPdfCurrency(transaction.amountDue)}
          </Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Amount Paid</Text>
          <Text style={pdfStyles.boldValue}>
            {formatPdfCurrency(transaction.amountPaid)}
          </Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Payment Mode</Text>
          <Text style={pdfStyles.value}>
            {formatPaymentMode(transaction.paymentMode)}
          </Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Status</Text>
          <Text style={pdfStyles.value}>{transaction.status}</Text>
        </View>
      </View>

      {transaction.feeBreakdown &&
        Object.keys(transaction.feeBreakdown).length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Fee Details</Text>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>
                Fee Type
              </Text>
              <Text
                style={[
                  pdfStyles.tableHeaderCell,
                  { textAlign: "right", width: 80 },
                ]}
              >
                Amount
              </Text>
            </View>
            {Object.entries(transaction.feeBreakdown).map(([feeName, amount]) => (
              <View key={feeName} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { flex: 1 }]}>
                  {feeName.replace(/_/g, " ")}
                </Text>
                <Text style={[pdfStyles.tableCellAmount, { width: 80, textAlign: "right" }]}>
                  {formatPdfCurrency(amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

      <View style={pdfStyles.footer}>
        <Text style={pdfStyles.footerText}>
          This is a computer-generated receipt
        </Text>
        <Text style={pdfStyles.footerText}>Authorized Signature</Text>
      </View>
    </Page>
  </Document>
);

export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  studentName,
  academicYearName,
  schoolName,
}) => {
  if (!transaction) return null;

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.print();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Fee Receipt"
      size="xl"
      className="max-w-4xl"
    >
      <div className="p-0" id="fee-receipt-content">
        <div className="px-8 py-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {schoolName || "School Name"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Fee Receipt</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wide">
                Receipt No.
              </p>
              <p className="text-sm font-mono text-slate-700">
                {transaction.receiptNumber || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-5 border-b border-slate-200">
          <div className="grid grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                Date
              </p>
              <p className="text-slate-700">
                {formatDisplayDate(transaction.paymentDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                Student
              </p>
              <p className="text-slate-700 font-medium">{studentName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                Admission No.
              </p>
              <p className="text-slate-700 font-mono">
                {transaction.admissionNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                Academic Year
              </p>
              <p className="text-slate-700">{academicYearName}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
              <div className="mb-4">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                  Class
                </p>
                <p className="text-slate-700">
                  {transaction.className}
                  {transaction.classSection
                    ? ` - Section ${transaction.classSection}`
                    : ""}
                  {transaction.termNumber
                    ? ` | Term ${transaction.termNumber}`
                    : ""}
                </p>
              </div>

              {transaction.feeBreakdown &&
                Object.keys(transaction.feeBreakdown).length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                      Fee Details
                    </p>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Fee Type
                          </th>
                          <th className="text-right py-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(transaction.feeBreakdown).map(
                          ([feeName, amount]) => (
                            <tr
                              key={feeName}
                              className="border-b border-slate-100"
                            >
                              <td className="py-2 text-sm text-slate-600 capitalize">
                                {feeName.replace(/_/g, " ")}
                              </td>
                              <td className="py-2 text-sm text-slate-700 text-right">
                                {formatCurrency(amount)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                Payment Summary
              </p>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">Total Amount</span>
                  <span className="text-sm font-medium text-slate-700">
                    {formatCurrency(transaction.amountDue)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">Amount Paid</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(transaction.amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">Payment Mode</span>
                  <span className="text-sm text-slate-700">
                    {formatPaymentMode(transaction.paymentMode)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-slate-500">Status</span>
                  <span className="text-sm font-medium text-slate-700 capitalize">
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 border-t border-slate-200">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <p>This is a computer-generated receipt</p>
            <p>Authorized Signature</p>
          </div>
        </div>

        <div className="px-8 py-4 border-t border-slate-200 flex gap-3 no-print">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button onClick={handlePrint} className="flex-1 gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <PDFDownloadLink
            document={
              <ReceiptPDF
                transaction={transaction}
                studentName={studentName}
                academicYearName={academicYearName}
                schoolName={schoolName}
              />
            }
            fileName={`receipt-${transaction.receiptNumber || "unknown"}.pdf`}
            className="flex-1"
          >
            {({ loading }) => (
              <Button
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                <Download className="w-4 h-4" />
                {loading ? "Preparing..." : "Download PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 0;
            margin: 0;
          }
          #fee-receipt-content {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </BaseModal>
  );
};

export default FeeReceiptModal;

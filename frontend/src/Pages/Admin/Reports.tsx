import React, { useState, useEffect, useCallback } from 'react';

import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { reportService, type AttendanceReport, type FeesReport, type SummaryReport } from '../../services/reportService';
import { useClasses } from '../../hooks/queries';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { BarChart3, Users, DollarSign, GraduationCap, Clock, Download } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

type ReportType = 'summary' | 'attendance' | 'fees';

const Reports: React.FC = () => {
  const { showNotification } = useNotification();
  const [_loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>('summary');
  const { data: classes = [] } = useClasses();
  const { selectedYear } = useAcademicYear();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceReport[]>([]);
  const [feesData, setFeesData] = useState<FeesReport[]>([]);



  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        classId: selectedClass ? parseInt(selectedClass) : undefined,
        academicYearId: selectedYear?.id ? Number(selectedYear.id) : undefined,
      };

      switch (reportType) {
        case 'summary': {
          const summaryData = await reportService.getSummaryReport(filters);
          setSummary(summaryData);
          break;
        }
        case 'attendance': {
          const attendanceReport = await reportService.getAttendanceReport(filters);
          setAttendanceData(attendanceReport);
          break;
        }
        case 'fees': {
          const feesReport = await reportService.getFeesReport(filters);
          setFeesData(feesReport);
          break;
        }
      }
    } catch {
      showNotification('Failed to fetch report', 'error');
    } finally {
      setLoading(false);
    }
  }, [reportType, selectedClass, selectedYear?.id, showNotification]);



  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="space-y-6 pb-12">
        <PageHeader 
          title="Reports Dashboard"
          subtitle="View comprehensive reports and analytics"
          breadcrumb={{
            links: [
              { label: "Reports", href: "/admin/reports" },
              { label: "Reports", active: true }
            ]
          }}
          actions={[
            {
              label: "Export",
              icon: Download,
              onClick: () => showNotification('Export feature coming soon', 'info'),
              variant: 'outline'
            }
          ]}
        />

        {/* Report Type Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 p-2 flex gap-2">
          {[
            { type: 'summary', label: 'Summary', icon: BarChart3 },
            { type: 'attendance', label: 'Attendance', icon: Clock },
            { type: 'fees', label: 'Fees Collection', icon: DollarSign },
          ].map(tab => (
            <button
              key={tab.type}
              onClick={() => setReportType(tab.type as ReportType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                reportType === tab.type
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Class (Optional)</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name} - Section {cls.section || 'A'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Report */}
        {reportType === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Students</p>
                  <p className="text-4xl font-bold mt-2">{summary?.totalStudents || 0}</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl">
                  <Users className="w-8 h-8" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100">Total Teachers</p>
                  <p className="text-4xl font-bold mt-2">{summary?.totalTeachers || 0}</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl">
                  <GraduationCap className="w-8 h-8" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Classes</p>
                  <p className="text-4xl font-bold mt-2">{summary?.totalClasses || 0}</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl">
                  <BarChart3 className="w-8 h-8" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Report */}
        {reportType === 'attendance' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">Attendance Report</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Class</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase">Students</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase">Present</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase">Absent</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase">Late</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceData.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {row.className} {row.classSection && `- ${row.classSection}`}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600">{row.totalStudents}</td>
                      <td className="px-6 py-4 text-center text-sm text-emerald-600 font-medium">{row.presentCount}</td>
                      <td className="px-6 py-4 text-center text-sm text-red-600 font-medium">{row.absentCount}</td>
                      <td className="px-6 py-4 text-center text-sm text-amber-600 font-medium">{row.lateCount}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          row.attendancePercentage >= 90 ? 'bg-emerald-100 text-emerald-700' :
                          row.attendancePercentage >= 75 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {row.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attendanceData.length === 0 && (
                <div className="p-12 text-center text-slate-500">No attendance data available</div>
              )}
            </div>
          </div>
        )}

        {/* Fees Report */}
        {reportType === 'fees' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">Fee Collection Report</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Class</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase">Total</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase">Collected</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase">Pending</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feesData.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {row.className} {row.classSection && `- ${row.classSection}`}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-600">{formatCurrency(row.totalAmount)}</td>
                      <td className="px-6 py-4 text-right text-sm text-emerald-600 font-medium">{formatCurrency(row.paidAmount)}</td>
                      <td className="px-6 py-4 text-right text-sm text-red-600 font-medium">{formatCurrency(row.pendingAmount)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          row.collectionPercentage >= 90 ? 'bg-emerald-100 text-emerald-700' :
                          row.collectionPercentage >= 75 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {row.collectionPercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {feesData.length === 0 && (
                <div className="p-12 text-center text-slate-500">No fee data available</div>
              )}
            </div>
          </div>
        )}
      </div>
  );
};

export default Reports;

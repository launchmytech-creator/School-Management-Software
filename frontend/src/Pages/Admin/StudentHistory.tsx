import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, User, GraduationCap, Calendar, 
  TrendingUp, DollarSign, BarChart3, 
  ChevronDown, ChevronUp, Loader2, 
  CheckCircle, Clock, AlertTriangle, XCircle,
  Mail, Phone
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { studentService } from '../../services/studentService';
import type { 
  StudentHistory as StudentHistoryData, 
  AttendanceYearData, 
  ResultsYearData, 
  FeeYearData,
  Student 
} from '../../types/student';
import { formatCurrency } from '../../lib/utils';

const StudentHistory: React.FC = () => {
  const { showNotification } = useNotification();
  
  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<StudentHistoryData | null>(null);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch all students for search
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        const data = await studentService.getStudents({});
        setStudents(data);
      } catch {
        showNotification('Failed to load students', 'error');
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [showNotification]);

  // Fetch student history
  const fetchHistory = useCallback(async () => {
    if (!selectedStudentId) return;
    try {
      setLoadingHistory(true);
      const data = await studentService.getStudentHistory(selectedStudentId);
      setHistory(data);
      // Only expand current academic year by default
      const currentYearIds = new Set(
        data.enrollments.filter(e => e.is_current).map(e => e.academic_year_id)
      );
      setExpandedYears(currentYearIds);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      showNotification(error.response?.data?.message || 'Failed to load student history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedStudentId, showNotification]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchHistory();
    }
  }, [selectedStudentId, fetchHistory]);

  // Filter students by search term (name OR admission number)
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students.slice(0, 20);
    const term = searchTerm.toLowerCase();
    return students.filter(s => 
      s.fullName.toLowerCase().includes(term) || 
      s.admissionNumber.toLowerCase().includes(term)
    ).slice(0, 20);
  }, [students, searchTerm]);

  // Toggle year expansion
  const toggleYear = (yearId: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(yearId)) {
        next.delete(yearId);
      } else {
        next.add(yearId);
      }
      return next;
    });
  };

  // Get attendance for a specific year
  const getAttendanceForYear = (yearId: number): AttendanceYearData | undefined => {
    return history?.attendance.find(a => a.academic_year_id === yearId);
  };

  // Get results for a specific year
  const getResultsForYear = (yearId: number): ResultsYearData | undefined => {
    return history?.results.find(r => r.academic_year_id === yearId);
  };

  // Get fees for a specific year
  const getFeesForYear = (yearId: number): FeeYearData | undefined => {
    return history?.fees.find(f => f.academic_year_id === yearId);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
            <CheckCircle className="w-3 h-3" /> {status}
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            <Clock className="w-3 h-3" /> Partial
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
            <AlertTriangle className="w-3 h-3" /> Pending
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Student Records"
        subtitle="View comprehensive history of students across all academic years"
      />

      {/* Student Search */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name or admission number..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            
            {/* Dropdown */}
            {showDropdown && searchTerm && filteredStudents.length > 0 && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-80 overflow-y-auto">
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  </div>
                ) : (
                  filteredStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setSearchTerm(`${student.fullName} (${student.admissionNumber})`);
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold">
                        {student.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{student.fullName}</p>
                        <p className="text-xs text-slate-500">
                          {student.admissionNumber} • {student.className} {student.classSection}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Content */}
      {selectedStudentId && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Student Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 sticky top-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 text-3xl font-black mx-auto mb-4">
                  {history?.student.full_name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <h3 className="text-lg font-bold text-slate-900 truncate">{history?.student.full_name}</h3>
                <p className="text-sm text-slate-500 truncate">ADM: {history?.student.admission_number}</p>
                <p className="text-sm text-slate-500 truncate">
                  {history?.student.class_name} {history?.student.class_section}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Status</p>
                    <p className="text-sm font-semibold text-slate-700 capitalize truncate">{history?.student.status}</p>
                  </div>
                </div>
                
                {history?.student.parent_name && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Parent</p>
                        <p className="text-sm font-semibold text-slate-700 truncate">{history.student.parent_name}</p>
                      </div>
                    </div>
                    {history.student.parent_email && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 uppercase tracking-wider">Parent Email</p>
                          <p className="text-sm font-semibold text-slate-700 break-all">{history.student.parent_email}</p>
                        </div>
                      </div>
                    )}
                    {history.student.parent_phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400 uppercase tracking-wider">Parent Phone</p>
                          <p className="text-sm font-semibold text-slate-700">{history.student.parent_phone}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Years Enrolled</p>
                    <p className="text-sm font-semibold text-slate-700">{history?.enrollments.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* History Details */}
          <div className="lg:col-span-3 space-y-6">
            {loadingHistory ? (
              <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-slate-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            ) : history ? (
              <>
                {/* Year Cards */}
                {history.enrollments.map((enrollment) => {
                  const isExpanded = expandedYears.has(enrollment.academic_year_id);
                  const attendance = getAttendanceForYear(enrollment.academic_year_id);
                  const results = getResultsForYear(enrollment.academic_year_id);
                  const fees = getFeesForYear(enrollment.academic_year_id);

                  return (
                    <div 
                      key={enrollment.academic_year_id}
                      className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
                    >
                      {/* Year Header */}
                      <button
                        onClick={() => toggleYear(enrollment.academic_year_id)}
                        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-bold text-slate-900">
                              Academic Year {enrollment.academic_year_name}
                              {enrollment.is_current && (
                                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                  Current
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-slate-500">
                              Class: {enrollment.class_name} {enrollment.class_section}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {attendance && (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              (attendance.percentage || 0) >= 75 
                                ? 'bg-emerald-100 text-emerald-700'
                                : (attendance.percentage || 0) >= 50
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              {attendance.percentage || 0}% Attendance
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Year Content */}
                      {isExpanded && (
                        <div className="px-6 pb-6 space-y-6 border-t border-slate-100 pt-4">
                          {/* Attendance Chart */}
                          {attendance && attendance.monthly_breakdown.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Attendance</h4>
                                <span className="text-sm text-slate-500 ml-auto">
                                  Overall: {attendance.percentage}% ({attendance.present}/{attendance.total_days} days)
                                </span>
                              </div>
                              <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={attendance.monthly_breakdown}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="#64748b" domain={[0, 100]} />
                                    <Tooltip 
                                      contentStyle={{ 
                                        backgroundColor: '#fff', 
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px'
                                      }}
                                      formatter={(value: number) => [`${value}%`, 'Attendance']}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="percentage" 
                                      stroke="#3b82f6" 
                                      strokeWidth={3}
                                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                                      activeDot={{ r: 7, fill: '#1d4ed8' }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}

                          {/* Results & Fees Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Results */}
                            {results && (
                              <div className="bg-slate-50 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                  <TrendingUp className="w-5 h-5 text-purple-600" />
                                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Exam Results</h4>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Exams Taken</span>
                                    <span className="text-sm font-bold text-slate-900">{results.exams_taken}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Average Marks</span>
                                    <span className="text-sm font-bold text-slate-900">{results.average_marks.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Highest</span>
                                    <span className="text-sm font-bold text-emerald-600">{results.highest_marks.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Lowest</span>
                                    <span className="text-sm font-bold text-rose-600">{results.lowest_marks.toFixed(1)}%</span>
                                  </div>
                                  <div className="pt-2 border-t border-slate-200">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-slate-600">Status</span>
                                      {getStatusBadge(results.status)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Fees */}
                            {fees && (
                              <div className="bg-slate-50 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                  <DollarSign className="w-5 h-5 text-emerald-600" />
                                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Fee Summary</h4>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Total Amount</span>
                                    <span className="text-sm font-bold text-slate-900">{formatCurrency(fees.total_amount)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Paid</span>
                                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(fees.paid_amount)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Pending</span>
                                    <span className="text-sm font-bold text-rose-600">{formatCurrency(fees.pending_amount)}</span>
                                  </div>
                                  
                                  {/* Progress Bar */}
                                  <div className="pt-2">
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-emerald-500 transition-all"
                                        style={{ 
                                          width: `${fees.total_amount > 0 ? (fees.paid_amount / fees.total_amount) * 100 : 0}%` 
                                        }}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="pt-2 border-t border-slate-200">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-slate-600">Status</span>
                                      {getStatusBadge(fees.status)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Empty State */}
                          {!attendance && !results && !fees && (
                            <div className="text-center py-8 text-slate-500">
                              No records found for this academic year
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {history.enrollments.length === 0 && (
                  <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-slate-100 text-center">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No enrollment history found</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-slate-100 text-center">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Select a student to view their history</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedStudentId && (
        <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-slate-100 text-center">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Search and select a student to view their history</p>
        </div>
      )}
    </div>
  );
};

export default StudentHistory;

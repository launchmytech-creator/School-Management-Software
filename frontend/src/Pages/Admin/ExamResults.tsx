import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { examResultService, type ExamResult, type ClassPerformance } from '../../services/examResultService';
import { classService } from '../../services/classService';
import { examService } from '../../services/examService';
import type { Class } from '../../types/class';
import type { Exam } from '../../services/examService';
import { GraduationCap, TrendingUp, Award, BarChart3, Download } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { SkeletonTable } from '../../components/common/Skeleton';

const ExamResults: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [performance, setPerformance] = useState<ClassPerformance[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    }
  }, [showNotification]);

  const fetchExams = useCallback(async () => {
    try {
      const data = await examService.getExams();
      setExams(data);
    } catch {
      showNotification('Failed to fetch exams', 'error');
    }
  }, [showNotification]);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const filters: {
        classId?: number;
        examId?: number;
      } = {};
      
      if (selectedClass) filters.classId = parseInt(selectedClass);
      if (selectedExam) filters.examId = parseInt(selectedExam);
      
      const data = await examResultService.getResults(filters);
      setResults(data);

      if (selectedExam) {
        try {
          const perfData = await examResultService.getClassPerformance(parseInt(selectedExam));
          setPerformance(perfData);
        } catch {
          setPerformance([]);
        }
      } else {
        setPerformance([]);
      }
    } catch {
      showNotification('Failed to fetch results', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedExam, showNotification]);

  useEffect(() => {
    fetchClasses();
    fetchExams();
  }, [fetchClasses, fetchExams]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const filteredResults = results.filter(r =>
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: results.length,
    passed: results.filter(r => r.marksObtained >= (r.maxMarks * 0.4)).length,
    failed: results.filter(r => r.marksObtained < (r.maxMarks * 0.4)).length,
    avgMarks: results.length > 0 
      ? (results.reduce((sum, r) => sum + r.marksObtained, 0) / results.length).toFixed(1)
      : 0,
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A':
      case 'A+':
        return 'bg-emerald-100 text-emerald-700';
      case 'B':
      case 'B+':
        return 'bg-blue-100 text-blue-700';
      case 'C':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <AdminLayout title="Exam Results">
      <div className="space-y-6 pb-12">
        <PageHeader 
          title="Exam Results"
          subtitle="View and analyze student examination results"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Results", active: true }
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Records</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <GraduationCap className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.passed}</p>
                <p className="text-sm text-emerald-600">Passed</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl border border-red-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
                <p className="text-sm text-red-600">Failed</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-700">{stats.avgMarks}</p>
                <p className="text-sm text-purple-600">Avg Marks</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <FilterBar 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => { setSearchTerm(''); setSelectedClass(''); setSelectedExam(''); }}
          searchPlaceholder="Search by student, admission number, or subject..."
        >
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-48"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - Section {cls.section || 'A'}</option>
            ))}
          </select>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-48"
          >
            <option value="">All Exams</option>
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>{exam.name}</option>
            ))}
          </select>
        </FilterBar>

        {performance.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Class Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {performance.map((perf, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900">{perf.subjectName}</span>
                    <span className="text-xs text-slate-500">{perf.subjectCode}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg:</span>
                      <span className="font-semibold">{perf.averageMarks.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Highest:</span>
                      <span className="font-semibold text-emerald-600">{perf.highestMarks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lowest:</span>
                      <span className="font-semibold text-red-600">{perf.lowestMarks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Appeared:</span>
                      <span className="font-semibold">{perf.studentsAppeared}/{perf.totalStudents}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonTable columns={7} rows={10} />
        ) : filteredResults.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Exam</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Marks</th>
                    <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600">
                            {result.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{result.studentName}</p>
                            <p className="text-xs text-slate-500 font-mono">{result.admissionNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {result.className} {result.classSection && `- ${result.classSection}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div>
                          <p className="font-medium">{result.subjectName}</p>
                          <p className="text-xs text-slate-400">{result.subjectCode}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div>
                          <p className="font-medium">{result.examName}</p>
                          <p className="text-xs text-slate-400">{result.examType}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-semibold ${result.isAbsent ? 'text-red-500' : 'text-slate-900'}`}>
                          {result.isAbsent ? 'Absent' : `${result.marksObtained}/${result.maxMarks}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {result.isAbsent ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">AB</span>
                        ) : (
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${getGradeColor(result.grade)}`}>
                            {result.grade}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(result.examDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-medium">
                Showing {filteredResults.length} of {results.length} results
              </p>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="No results found"
            description={searchTerm || selectedClass || selectedExam ? "Try adjusting your filters" : "No exam results recorded yet"}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default ExamResults;

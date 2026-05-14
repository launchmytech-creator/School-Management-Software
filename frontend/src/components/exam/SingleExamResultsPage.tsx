import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Download, AlertCircle, CheckCircle, XCircle, FileX, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useNotification } from '../../context/NotificationContext';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { examResultService } from '../../services/examResultService';

interface SingleExamResultsPageProps {
  layout: 'admin' | 'accountant';
}

interface StudentResult {
  resultId: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  rollNumber: number | null;
  marksObtained: number;
  grade: string;
  isAbsent: boolean;
}

interface ExamResultsData {
  examId: number;
  examName: string;
  examType: string;
  examDate: string;
  maxMarks: number;
  subjectName: string;
  subjectCode: string;
  totalStudents: number;
  evaluated: number;
  passed: number;
  failed: number;
  absent: number;
  students: StudentResult[];
}

const getGradeColor = (grade: string) => {
  switch (grade?.toUpperCase()) {
    case "A":
    case "A+":
      return "bg-emerald-100 text-emerald-700";
    case "B":
    case "B+":
      return "bg-blue-100 text-blue-700";
    case "C":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-red-100 text-red-700";
  }
};

const getExamTypeBadgeColor = (examType: string) => {
  switch (examType) {
    case 'Annual':
      return 'bg-purple-100 text-purple-700';
    case 'Half Yearly':
      return 'bg-blue-100 text-blue-700';
    case 'Unit Test':
      return 'bg-amber-100 text-amber-700';
    case 'Class Test':
      return 'bg-green-100 text-green-700';
    case 'Final':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const SingleExamResultsPage: React.FC<SingleExamResultsPageProps> = ({ layout }) => {
  const { classId, subjectId, examId } = useParams<{ classId: string; subjectId: string; examId: string }>();
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();
  const { showNotification } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');

  const { data: allClasses = [] } = useClasses(selectedYear?.id);
  const classData = allClasses.find((c) => String(c.id) === classId);

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['exam-results', classId, subjectId, examId, selectedYear?.id],
    queryFn: () => examResultService.getSingleExamResults(
      parseInt(classId!),
      parseInt(subjectId!),
      parseInt(examId!),
      parseInt(selectedYear?.id!),
    ),
    enabled: !!classId && !!subjectId && !!examId && !!selectedYear?.id,
  });

  const filteredStudents = results?.students?.filter(s =>
    !searchTerm ||
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const basePath = layout === 'admin' ? '/admin' : '/accountant';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading exam results..." />
      </div>
    );
  }

  if (error || !results?.examId) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Exam Not Found"
          breadcrumb={{
            links: [
              { label: 'Exams', href: `${basePath}/exams` },
              { label: 'Error', active: true },
            ],
          }}
        />
        <EmptyState
          icon={AlertCircle}
          title="Exam not found"
          description="The requested exam could not be found or you don't have access to it."
          action={{
            label: 'Go to Examinations',
            onClick: () => navigate(`${basePath}/exams`)
          }}
        />
      </div>
    );
  }

  const examData = results as ExamResultsData;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={examData.examName}
        subtitle={`${classData?.name || ''} • ${examData.subjectName}`}
        breadcrumb={{
          links: [
            { label: 'Exams', href: `${basePath}/exams` },
            { label: examData.examName, active: true },
          ],
        }}
        actions={[
          {
            label: 'Back to Subjects',
            icon: ArrowLeft,
            onClick: () => navigate(`${basePath}/exam-results/class/${classId}?examId=${examId}`),
            variant: 'outline',
          },
          {
            label: 'Export',
            icon: Download,
            onClick: () => showNotification('Export feature coming soon', 'info'),
            variant: 'outline',
          },
        ]}
      />

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getExamTypeBadgeColor(examData.examType)}`}>
              {examData.examType}
            </span>
          </div>
          <div className="text-sm text-slate-600">
            {new Date(examData.examDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="text-sm text-slate-600">
            Max Marks: <span className="font-semibold">{examData.maxMarks}</span>
          </div>
          <div className="text-sm text-slate-600">
            {examData.subjectCode}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900">{examData.totalStudents}</p>
              <p className="text-sm text-slate-500">Total Students</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileX className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900">{examData.evaluated}</p>
              <p className="text-sm text-slate-500">Evaluated</p>
            </div>
            <div className="p-3 bg-violet-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-violet-500" />
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-700">{examData.passed}</p>
              <p className="text-sm text-emerald-600">Passed</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-700">{examData.failed}</p>
              <p className="text-sm text-red-600">Failed</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-amber-700">{examData.absent}</p>
              <p className="text-sm text-amber-600">Absent</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <FileX className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={() => setSearchTerm('')}
        searchPlaceholder="Search by student name or admission number..."
      />

      {filteredStudents.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Admission No
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Marks
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.resultId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {student.rollNumber || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">
                        {student.studentName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {student.admissionNumber}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-semibold ${student.isAbsent ? "text-red-500" : "text-slate-900"}`}>
                        {student.isAbsent
                          ? "-"
                          : `${student.marksObtained}/${examData.maxMarks}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.isAbsent ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                          AB
                        </span>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getGradeColor(student.grade)}`}>
                          {student.grade || "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {student.isAbsent ? (
                        <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                          <XCircle className="w-4 h-4" /> Absent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" /> Evaluated
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileX}
          title="No students found"
          description={
            searchTerm
              ? 'No students match your search criteria.'
              : 'No results have been entered for this exam yet.'
          }
        />
      )}
    </div>
  );
};

export default SingleExamResultsPage;
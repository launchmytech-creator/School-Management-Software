import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, GraduationCap, Download, AlertCircle, ChevronRight, CheckCircle, XCircle, FileX, Calendar, ArrowLeft, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useClasses } from '../../hooks/queries/useClasses';
import { useNotification } from '../../context/NotificationContext';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { examResultService } from '../../services/examResultService';
import { examService } from '../../services/examService';

interface SubjectResultsPageProps {
  layout: 'admin' | 'accountant';
}

interface ExamSummary {
  examId: number;
  examName: string;
  examType: string;
  examDate: string;
  maxMarks: number;
  totalStudents: number;
  evaluated: number;
  passed: number;
  failed: number;
  absent: number;
}

interface StudentResult {
  resultId: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  rollNumber: number | null;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  isAbsent: boolean;
}

const SubjectResultsPage: React.FC<SubjectResultsPageProps> = ({ layout }) => {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedYear } = useAcademicYear();
  const { showNotification } = useNotification();

  const examId = searchParams.get('examId') || '';

  const [searchTerm, setSearchTerm] = useState('');

  const { data: allClasses = [] } = useClasses(selectedYear?.id);
  const classData = allClasses.find((c) => String(c.id) === classId);

  const { data: examData } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examService.getById(parseInt(examId)),
    enabled: !!examId,
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['exam-students', classId, subjectId, examId, selectedYear?.id],
    queryFn: () => examResultService.getResults({
      examId: parseInt(examId),
      classId: parseInt(classId!),
      subjectId: parseInt(subjectId!),
      academicYearId: parseInt(selectedYear?.id!),
    }),
    enabled: !!classId && !!subjectId && !!examId && !!selectedYear?.id,
  });

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(s =>
      s.studentName.toLowerCase().includes(term) ||
      s.admissionNumber.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const basePath = layout === 'admin' ? '/admin' : '/accountant';

  if (loadingStudents && examId) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading students..." />
      </div>
    );
  }

  if (!examId) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Select an Exam"
          subtitle="View results for a specific exam"
          breadcrumb={{
            links: [
              { label: 'Exams', href: `${basePath}/exams` },
              { label: 'Results', active: true },
            ],
          }}
        />
        <EmptyState
          icon={GraduationCap}
          title="No exam selected"
          description="Please select an exam from the Examinations page to view results."
          action={{
            label: 'Go to Examinations',
            onClick: () => navigate(`${basePath}/exams`)
          }}
        />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Class Not Found"
          breadcrumb={{
            links: [
              { label: 'Exams', href: `${basePath}/exams` },
              { label: 'Error', active: true },
            ],
          }}
        />
        <EmptyState
          icon={Search}
          title="Class not found"
          description="The class you are looking for does not exist."
          action={{
            label: 'Go to Examinations',
            onClick: () => navigate(`${basePath}/exams`)
          }}
        />
      </div>
    );
  }

  if (examId && students.length > 0) {
    const passedCount = students.filter(s => !s.isAbsent && s.marksObtained >= s.maxMarks * 0.4).length;
    const failedCount = students.filter(s => !s.isAbsent && s.marksObtained < s.maxMarks * 0.4).length;
    const absentCount = students.filter(s => s.isAbsent).length;
    const evaluatedCount = students.filter(s => !s.isAbsent && s.marksObtained > 0).length;

    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title={examData?.name || 'Exam Results'}
          subtitle={`${classData.name} - Section ${classData.section || 'A'} • ${examData?.examType || ''}`}
          breadcrumb={{
            links: [
              { label: 'Exams', href: `${basePath}/exams` },
              { label: examData?.name || 'Results', active: true },
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-2xl font-bold text-slate-900">{students.length}</p>
            <p className="text-sm text-slate-500">Total Students</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-2xl font-bold text-slate-900">{evaluatedCount}</p>
            <p className="text-sm text-slate-500">Evaluated</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <p className="text-2xl font-bold text-emerald-700">{passedCount}</p>
            <p className="text-sm text-emerald-600">Passed</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-5">
            <p className="text-2xl font-bold text-red-700">{failedCount}</p>
            <p className="text-sm text-red-600">Failed</p>
          </div>
        </div>

        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => setSearchTerm('')}
          searchPlaceholder="Search student name or admission number..."
        />

        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <div
              key={student.resultId}
              className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{student.studentName}</p>
                  <p className="text-sm text-slate-500">
                    Roll: {student.rollNumber || 'N/A'} • Adm: {student.admissionNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {student.isAbsent ? (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                    Absent
                  </span>
                ) : (
                  <>
                    <span className="text-lg font-bold text-slate-900">
                      {student.marksObtained}/{student.maxMarks}
                    </span>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      student.marksObtained >= student.maxMarks * 0.6 ? 'bg-emerald-100 text-emerald-700' :
                      student.marksObtained >= student.maxMarks * 0.4 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {student.grade}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <EmptyState
            icon={GraduationCap}
            title="No students found"
            description="No students match your search criteria."
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Subject Results"
        subtitle={`${classData.name} - Section ${classData.section || 'A'}`}
        breadcrumb={{
          links: [
            { label: 'Exams', href: `${basePath}/exams` },
            { label: classData.name, active: true },
          ],
        }}
      />

      <EmptyState
        icon={Calendar}
        title="No exam results found"
        description="No results have been entered for this exam yet."
        action={{
          label: 'Go to Examinations',
          onClick: () => navigate(`${basePath}/exams`)
        }}
      />
    </div>
  );
};

export default SubjectResultsPage;
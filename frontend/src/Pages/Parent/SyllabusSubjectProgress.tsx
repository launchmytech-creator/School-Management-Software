import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useSelectedChild } from "../../context/SelectedChildContext";
import { useStudentClass, useParentChildren } from "../../hooks/queries";
import { syllabusService, type SubjectProgress } from "../../services/syllabusService";
import { subjectIcon } from "../../lib/subject-utils";
import { ArrowLeft, BookOpen, CheckCircle, Clock, Loader2, ChevronRight } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { GraduationCap } from "lucide-react";

const SyllabusSubjectProgress: React.FC = () => {
  const navigate = useNavigate();
  const { selectedChildId } = useSelectedChild();
  const { selectedYear } = useAcademicYear();
  const academicYearId = selectedYear?.id ? Number(selectedYear.id) : 0;

  const { data: childrenData } = useParentChildren(0);
  const children = childrenData || [];
  const selectedChild = children.find(c => c.id === selectedChildId);

  const { data: studentData, isLoading: loadingStudent } = useStudentClass(selectedChildId || 0);
  const classId = studentData?.currentClassId || 0;

  const [subjectsProgress, setSubjectsProgress] = useState<SubjectProgress[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  React.useEffect(() => {
    if (!classId) {
      setSubjectsProgress([]);
      return;
    }

    const fetchProgress = async () => {
      setLoadingProgress(true);
      try {
        const data = await syllabusService.getClassProgress(classId);
        setSubjectsProgress(data);
      } catch {
        setSubjectsProgress([]);
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchProgress();
  }, [classId]);

  const handleViewChapters = (subjectId: number, subjectName: string) => {
    navigate(`/parent/syllabus/subject/${subjectId}`, {
      state: { subjectName, classId },
    });
  };

  const stats = useMemo(() => {
    if (subjectsProgress.length === 0) return { total: 0, avgCompletion: 0 };

    const total = subjectsProgress.length;
    const avgCompletion = Math.round(
      subjectsProgress.reduce((sum, s) => sum + s.progressPercentage, 0) / total
    );

    return { total, avgCompletion };
  }, [subjectsProgress]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-600 bg-emerald-50";
    if (percentage >= 50) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const isLoading = loadingStudent || loadingProgress;

  if (!selectedChildId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={GraduationCap}
          title="No Student Selected"
          description="Please select a child from the dashboard to view syllabus progress."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Syllabus Progress"
        subtitle={`${selectedChild?.fullName || studentData?.fullName || "Student"} • ${selectedChild?.className || studentData?.className || ""} ${selectedChild?.classSection || studentData?.classSection || ""}`}
        breadcrumb={{
          links: [
            { label: "Dashboard", href: "/parent/dashboard" },
            { label: "Syllabus", active: true },
          ],
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Subjects</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${getProgressColor(stats.avgCompletion)}`}>
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Average Completion</p>
              <p className="text-2xl font-bold text-slate-900">{stats.avgCompletion}%</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading subjects...</span>
          </div>
        </div>
      ) : subjectsProgress.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjectsProgress.map((subject) => {
            const { icon, bg, text } = subjectIcon(subject.subjectName);
            return (
              <div
                key={subject.subjectId}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${bg}`}>
                      <span
                        className={`material-symbols-outlined text-xl ${text}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {subject.subjectName}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {subject.totalChapters} chapters
                      </p>
                    </div>
                  </div>
                  <span className={`text-2xl font-bold ${getProgressColor(subject.progressPercentage)}`}>
                    {subject.progressPercentage}%
                  </span>
                </div>

                <div className="mb-4">
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressBarColor(subject.progressPercentage)}`}
                      style={{ width: `${subject.progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{subject.completedChapters} completed</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{subject.pendingChapters} pending</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewChapters(subject.subjectId, subject.subjectName)}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View Chapters
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No subjects found</p>
        </div>
      )}
    </div>
  );
};

export default SyllabusSubjectProgress;
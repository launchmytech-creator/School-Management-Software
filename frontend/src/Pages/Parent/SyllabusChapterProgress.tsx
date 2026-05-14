import React, { useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useSelectedChild } from "../../context/SelectedChildContext";
import { useStudentClass, useParentChildren, useParentSubjectProgress } from "../../hooks/queries";
import { subjectIcon } from "../../lib/subject-utils";
import { ArrowLeft, CheckCircle, Clock, Loader2, BookOpen } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { GraduationCap } from "lucide-react";

const SyllabusChapterProgress: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedYear } = useAcademicYear();
  const { selectedChildId } = useSelectedChild();
  const academicYearId = selectedYear?.id ? Number(selectedYear.id) : 0;

  const subjectName = location.state?.subjectName || "Subject";
  const classIdFromState = location.state?.classId;

  const { data: childrenData } = useParentChildren(0);
  const children = childrenData || [];
  const selectedChild = children.find(c => c.id === selectedChildId);

  const { data: studentData } = useStudentClass(selectedChildId || 0);
  const classId = classIdFromState || studentData?.currentClassId || 0;

  const { data: chapters = [], isLoading } = useParentSubjectProgress(
    classId,
    Number(subjectId),
    academicYearId
  );

  const handleBack = () => {
    navigate("/parent/syllabus");
  };

  const stats = useMemo(() => {
    const completed = chapters.filter((c) => c.status === "completed").length;
    const inProgress = chapters.filter((c) => c.status === "in-progress").length;
    const pending = chapters.filter((c) => c.status === "pending").length;
    const total = chapters.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, inProgress, pending, total, percentage };
  }, [chapters]);

  const { icon, bg, text } = subjectIcon(subjectName);

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
        title={`${subjectName} - Chapters`}
        subtitle={`${selectedChild?.fullName || studentData?.fullName || "Student"} • ${selectedChild?.className || studentData?.className || ""} ${selectedChild?.classSection || studentData?.classSection || ""}`}
        breadcrumb={{
          links: [
            { label: "Dashboard", href: "/parent/dashboard" },
            { label: "Syllabus", href: "/parent/syllabus" },
            { label: subjectName, active: true },
          ],
        }}
        actions={[
          {
            label: "Back to Subjects",
            icon: ArrowLeft,
            onClick: handleBack,
            variant: "outline",
          },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Total</p>
              <p className="text-xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Completed</p>
              <p className="text-xl font-bold text-emerald-600">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">In Progress</p>
              <p className="text-xl font-bold text-amber-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bg}`}>
              <span
                className={`material-symbols-outlined text-xl ${text}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {icon}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Progress</p>
              <p className="text-xl font-bold text-slate-900">{stats.percentage}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bg}`}>
              <span
                className={`material-symbols-outlined text-xl ${text}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {icon}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{subjectName}</h3>
              <p className="text-sm text-slate-500">Chapter-wise progress</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading chapters...</span>
            </div>
          </div>
        ) : chapters.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {chapters.map((chapter, index) => {
              const isCompleted = chapter.status === "completed";
              const isInProgress = chapter.status === "in-progress";

              return (
                <div
                  key={chapter.chapterId}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">
                        {chapter.chapterName}
                      </h4>
                      {chapter.completedDate && (
                        <p className="text-xs text-slate-400">
                          Completed on{" "}
                          {new Date(chapter.completedDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {isCompleted ? (
                      <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </span>
                    ) : isInProgress ? (
                      <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        In Progress
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-sm font-medium">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No chapters found for this subject</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyllabusChapterProgress;
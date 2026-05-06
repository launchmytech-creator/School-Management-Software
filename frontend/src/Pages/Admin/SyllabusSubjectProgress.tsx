import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import { useClassById } from "../../hooks/queries/useClasses";
import { useClassProgress } from "../../hooks/queries/useSyllabus";
import { subjectIcon } from "../../lib/subject-utils";
import { BookOpen, CheckCircle, Clock, TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { QueryErrorFallback } from "../../components/error";

const SyllabusSubjectProgress: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");

  const { data: classData, isLoading: loadingClass } = useClassById(classId || "");
  const { data: subjectsProgress = [], isLoading: loadingProgress } = useClassProgress(classId || "");

  const filteredSubjects = useMemo(() => {
    return subjectsProgress.filter((s) =>
      s.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjectsProgress, searchTerm]);

  const stats = useMemo(() => {
    if (subjectsProgress.length === 0) return { total: 0, avgCompletion: 0 };

    const total = subjectsProgress.length;
    const avgCompletion = Math.round(
      subjectsProgress.reduce((sum, s) => sum + s.progressPercentage, 0) / total
    );

    return { total, avgCompletion };
  }, [subjectsProgress]);

  const handleViewChapters = (subjectId: number) => {
    if (!classId) return;
    navigate(`/admin/syllabus-tracking/class/${classId}/subject/${subjectId}`);
  };

  const handleBack = () => {
    navigate("/admin/syllabus-tracking");
  };

  const isLoading = loadingClass || loadingProgress;

  if (!classData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Class not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Syllabus Progress - ${classData.name}`}
        subtitle={`Section ${classData.section || "A"} • Track subject completion`}
        breadcrumb={{
          links: [
            { label: "Academics", href: "/admin/syllabus-tracking" },
            { label: "Syllabus Tracking", href: "/admin/syllabus-tracking" },
            { label: classData.name, active: true },
          ],
        }}
        actions={[
          {
            label: "Back to Classes",
            icon: ArrowLeft,
            onClick: handleBack,
            variant: "outline",
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <StatCard
          label="Total Subjects"
          value={stats.total}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          label="Avg Completion"
          value={`${stats.avgCompletion}%`}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={() => setSearchTerm("")}
        searchPlaceholder="Search subjects..."
      />

      <QueryErrorFallback>
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" message="Loading subjects..." />
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject.subjectId}
                subject={subject}
                onViewChapters={() => handleViewChapters(subject.subjectId)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              No Subjects Found
            </h3>
            <p className="text-slate-500">
              {searchTerm
                ? "Try adjusting your search"
                : "No subjects assigned to this class"}
            </p>
          </div>
        )}
      </QueryErrorFallback>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "emerald" | "red";
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

interface SubjectCardProps {
  subject: {
    subjectId: number;
    subjectName: string;
    totalChapters: number;
    completedChapters: number;
    inProgressChapters: number;
    pendingChapters: number;
    progressPercentage: number;
  };
  onViewChapters: () => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onViewChapters }) => {
  const { icon: subjectIconName, bg: iconBg, text: iconText } = subjectIcon(subject.subjectName);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-600 bg-emerald-50";
    if (percentage >= 50) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <span
            className={`material-symbols-outlined text-xl ${iconText}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {subjectIconName}
          </span>
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${getProgressTextColor(subject.progressPercentage)}`}>
          {subject.progressPercentage}%
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2">{subject.subjectName}</h3>

      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Progress</span>
          <span className="text-slate-600 font-bold">
            {subject.completedChapters}/{subject.totalChapters} chapters
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(subject.progressPercentage)}`}
            style={{ width: `${subject.progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-emerald-500" />
          <span className="text-slate-600">{subject.completedChapters} completed</span>
        </div>
        {subject.inProgressChapters > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span className="text-slate-600">{subject.inProgressChapters} in progress</span>
          </div>
        )}
      </div>

      <Button
        onClick={onViewChapters}
        className="w-full gap-2"
        size="sm"
      >
        View Chapters
      </Button>
    </div>
  );
};

export default SyllabusSubjectProgress;

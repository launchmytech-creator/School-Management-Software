import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useClassById } from "../../hooks/queries/useClasses";
import { useSubjectsByClass } from "../../hooks/queries/useSubjects";
import { useSubjectChapters } from "../../hooks/queries/useSyllabus";
import { useUpdateChapterStatus, useBulkUpdateChapterStatus } from "../../hooks/mutations/useSubjectMutations";
import { formatDate } from "../../lib/utils";
import { ArrowLeft, CheckCircle, Clock, Circle, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { QueryErrorFallback } from "../../components/error";
import { useNotification } from "../../context/NotificationContext";

const SyllabusChapterProgress: React.FC = () => {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingChapter, setUpdatingChapter] = useState<number | null>(null);

  const { data: classData, isLoading: loadingClass } = useClassById(classId || "");
  const { data: subjectsData = [] } = useSubjectsByClass(classId ? parseInt(classId) : 0);
  const {
    data: chaptersData = [],
    isLoading: loadingChapters,
    refetch: refetchChapters,
  } = useSubjectChapters(classId || "", subjectId ? parseInt(subjectId) : 0, selectedYear?.id || "");

  const subjectName = useMemo(() => {
    const subject = subjectsData.find((s) => s.subjectId.toString() === subjectId);
    return subject?.subjectName || "";
  }, [subjectsData, subjectId]);

  const filteredChapters = useMemo(() => {
    let filtered = chaptersData.filter((ch) =>
      ch.chapterName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter((ch) => ch.status === statusFilter);
    }

    return filtered.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }, [chaptersData, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    if (chaptersData.length === 0) return { total: 0, completed: 0, inProgress: 0, pending: 0, percentage: 0 };

    const total = chaptersData.length;
    const completed = chaptersData.filter((ch) => ch.status === "completed").length;
    const inProgress = chaptersData.filter((ch) => ch.status === "in-progress").length;
    const pending = chaptersData.filter((ch) => ch.status === "pending" || !ch.status).length;
    const percentage = Math.round((completed / total) * 100);

    return { total, completed, inProgress, pending, percentage };
  }, [chaptersData]);

  const updateChapterStatusMutation = useUpdateChapterStatus();
  const bulkUpdateMutation = useBulkUpdateChapterStatus();

  const handleUpdateStatus = async (chapterId: number, status: "completed" | "in-progress" | "pending") => {
    if (!classId || !subjectId || !selectedYear?.id) return;

    setUpdatingChapter(chapterId);
    try {
      await updateChapterStatusMutation.mutateAsync({
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        chapterId,
        status,
        academicYearId: parseInt(selectedYear.id),
      });

      showNotification(`Chapter marked as ${status}`, "success");
      refetchChapters();
    } catch {
      showNotification("Failed to update status", "error");
    } finally {
      setUpdatingChapter(null);
    }
  };

  const handleBulkUpdate = async (newStatus: "completed" | "in-progress" | "pending") => {
    if (!classId || !subjectId || !selectedYear?.id || chaptersData.length === 0) return;

    setUpdatingChapter(-1);
    try {
      await bulkUpdateMutation.mutateAsync({
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        chapterIds: chaptersData.map((ch) => ch.chapterId),
        status: newStatus,
        academicYearId: parseInt(selectedYear.id),
      });

      showNotification(`All chapters marked as ${newStatus}`, "success");
      refetchChapters();
    } catch {
      showNotification("Failed to update chapters", "error");
    } finally {
      setUpdatingChapter(null);
    }
  };

  const handleBack = () => {
    if (classId) {
      navigate(`/admin/syllabus-tracking/class/${classId}`);
    }
  };

  const getStatusIcon = (status: string | null | undefined) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadgeColor = (status: string | null | undefined) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "in-progress":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const isLoading = loadingClass || loadingChapters;

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
        title={`Chapters - ${subjectName || "Loading..."}`}
        subtitle={`${classData.name} - Section ${classData.section || "A"} • Manage chapter completion`}
        breadcrumb={{
          links: [
            { label: "Academics", href: "/admin/syllabus-tracking" },
            { label: "Syllabus Tracking", href: "/admin/syllabus-tracking" },
            { label: classData.name, href: `/admin/syllabus-tracking/class/${classId}` },
            { label: "Chapters", active: true },
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Chapters" value={stats.total} color="blue" />
        <StatCard label="Completed" value={stats.completed} color="emerald" />
        <StatCard label="In Progress" value={stats.inProgress} color="amber" />
        <StatCard label="Completion" value={`${stats.percentage}%`} color={stats.percentage >= 80 ? "emerald" : stats.percentage >= 50 ? "amber" : "red"} />
      </div>

      {chaptersData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Bulk Actions</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdate("pending")}
                disabled={updatingChapter !== null}
              >
                Mark All Pending
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdate("in-progress")}
                disabled={updatingChapter !== null}
              >
                Mark All In Progress
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkUpdate("completed")}
                disabled={updatingChapter !== null}
              >
                Mark All Complete
              </Button>
            </div>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(stats.percentage)}`}
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      )}

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={() => {
          setSearchTerm("");
          setStatusFilter("all");
        }}
        searchPlaceholder="Search chapters..."
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="pending">Pending</option>
        </select>
      </FilterBar>

      <QueryErrorFallback>
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" message="Loading chapters..." />
          </div>
        ) : filteredChapters.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sequence</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chapter Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredChapters.map((chapter) => (
                  <tr key={chapter.chapterId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-sm text-slate-600">
                        {chapter.sequenceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">{chapter.chapterName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(chapter.status)}
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusBadgeColor(chapter.status)}`}>
                          {chapter.status || "pending"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {chapter.completedDate ? formatDate(chapter.completedDate) : "--"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={chapter.status || "pending"}
                        onChange={(e) =>
                          handleUpdateStatus(
                            chapter.chapterId,
                            e.target.value as "pending" | "in-progress" | "completed"
                          )
                        }
                        disabled={updatingChapter !== null && updatingChapter !== chapter.chapterId}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border-0 cursor-pointer transition-colors ${getStatusBadgeColor(chapter.status)} disabled:opacity-50`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Circle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Chapters Found</h3>
            <p className="text-slate-500">
              {searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : "No chapters available for this subject"}
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
  color: "blue" | "emerald" | "amber" | "red";
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default SyllabusChapterProgress;

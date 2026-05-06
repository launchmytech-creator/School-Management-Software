import React, { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useSelectedChild } from "../../context/SelectedChildContext";
import { useParentDashboard } from "../../hooks/queries";
import {
  ParentHeader,
  AttendanceSummaryCard,
  FeeSummaryCard,
  ExamResultCard,
  AnnouncementsCard,
} from "../../components/parent/dashboard";

/** Parent Dashboard Page
 * 
 * Displays selected child's overview: attendance, fee status, exam results, announcements.
 * Child selection is managed via SelectedChildContext (persisted in localStorage).
 * Uses parent dashboard API to fetch all data for the logged-in parent's linked children.
 */
const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const { selectedChildId, setSelectedChildId } = useSelectedChild();
  const { data, isLoading } = useParentDashboard(user?.id ?? 0);
  // const { selectedChildId } = useSelectedChild();

  const children = useMemo(() => data?.children ?? [], [data?.children]);

  const selectedChild = useMemo(() => {
    if (selectedChildId && children.length > 0) {
      return (
        children.find((c) => c.student.id === selectedChildId) || children[0]
      );
    }
    return children[0] || null;
  }, [children, selectedChildId]);

  React.useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].student.id);
    }
  }, [children, selectedChildId, setSelectedChildId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#4A9FD4] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">
              family_restroom
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">
            No Students Linked
          </h3>
          <p className="text-sm text-slate-400">
            Contact school administration to link your children.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {selectedChild && (
        <>
          <ParentHeader
            child={selectedChild}
            academicYear={selectedYear?.name}
            children={children}
            selectedChildId={selectedChildId}
            onChildSelect={setSelectedChildId}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <AttendanceSummaryCard
                attendance={selectedChild.attendance_summary}
              />
              <ExamResultCard
                examResult={selectedChild.exam_result}
                studentId={selectedChild.student.id}
              />
            </div>

            <div className="space-y-6">
              <FeeSummaryCard
                feeSummary={selectedChild.fee_summary}
                studentId={selectedChild.student.id}
              />
              <AnnouncementsCard
                announcements={data?.recentAnnouncements || []}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentDashboard;

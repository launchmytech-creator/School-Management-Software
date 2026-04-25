import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useSelectedChild } from "../../context/SelectedChildContext";
import { useParentChildren, useStudentResults } from "../../hooks/queries";
import type { LinkedStudent } from "../../types/parent";
import type { StudentResult } from "../../services/examResultService";
import PerformanceTrendChart from "../../components/charts/PerformanceTrendChart";
import SubjectCard from "../../components/students/SubjectCard";
import ExamTypeFilter from "../../components/students/ExamTypeFilter";
import PageHeader from "../../components/common/PageHeader";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

// ── main ──────────────────────────────────────────────────────────────────────

const EMPTY_CHILDREN: LinkedStudent[] = [];

/** Parent Exam Results Page
 * 
 * Displays child's exam results grouped by term/semester.
 * Shows subject-wise marks, grades, and overall percentage.
 * Uses SelectedChildContext for child selection.
 */
const ParentExamResults: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const { selectedChildId } = useSelectedChild();

  const { data: childrenData, isLoading: childrenLoading } = useParentChildren(Number(user?.id));
  const children = childrenData || EMPTY_CHILDREN;

  const selected = useMemo(() => {
    if (selectedChildId && children.length > 0) {
      return children.find(c => c.id === selectedChildId) || children[0] || null;
    }
    return children[0] || null;
  }, [children, selectedChildId]);

  const [activeType, setActiveType] = useState("All");
  const [activeSubject, setActiveSubject] = useState("Mathematics");

  const { data: results = [] } = useStudentResults(selected?.id ? selected.id : 0, {
    academicYearId: selectedYear?.id ? Number(selectedYear.id) : undefined,
  });

  // derived
  const filtered = results.filter(
    (r) => activeType === "All" || r.examType === activeType,
  );

  // latest result per subject (for cards)
  const latestBySubject = filtered.reduce<Record<string, StudentResult>>(
    (acc, r) => {
      if (
        !acc[r.subjectName] ||
        new Date(r.examDate) > new Date(acc[r.subjectName].examDate)
      ) {
        acc[r.subjectName] = r;
      }
      return acc;
    },
    {},
  );
  const subjectCards = Object.values(latestBySubject);

  // subjects list for trend legend
  const allSubjects = [...new Set(results.map((r) => r.subjectName))];

  // trend chart data — group by exam name/date
  const trendData = (() => {
    const byExam: Record<string, Record<string, number | string>> = {};
    results.forEach((r) => {
      const key = r.examName;
      if (!byExam[key]) byExam[key] = { name: key };
      byExam[key][r.subjectName] = Math.round(
        (r.marksObtained / r.maxMarks) * 100,
      );
    });
    return Object.values(byExam);
  })();

  // summary stats
  const totalMarks = filtered.reduce((s, r) => s + r.marksObtained, 0);
  const totalMax = filtered.reduce((s, r) => s + r.maxMarks, 0);
  const overallAvg =
    totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : "—";
  const bestSubject = subjectCards.reduce<StudentResult | null>(
    (best, r) =>
      !best || r.marksObtained / r.maxMarks > best.marksObtained / best.maxMarks
        ? r
        : best,
    null,
  );
  const worstSubject = subjectCards.reduce<StudentResult | null>(
    (worst, r) =>
      !worst ||
      r.marksObtained / r.maxMarks < worst.marksObtained / worst.maxMarks
        ? r
        : worst,
    null,
  );

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <PageHeader
        title="Marks & Academic Performance"
        subtitle={selected ? `${selected.fullName} • ${selected.className || 'N/A'} • ${selectedYear?.name || ''} Session` : undefined}
        breadcrumb={{
          links: [
            { label: 'Dashboard', href: '/parent/dashboard' },
            { label: 'Results & Marks', active: true },
          ],
        }}
      />

{/* Subject cards */}
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Academic Performance</h3>
          
          <ExamTypeFilter
            activeType={activeType}
            onChange={setActiveType}
          />

          {subjectCards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No exam results found</p>
              <p className="text-xs text-slate-400 mt-1">Results will appear here once exams are graded.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {subjectCards.map((r) => (
                <SubjectCard key={r.id} result={r} />
              ))}
            </div>
          )}
        </div>

        {/* Performance Trend */}
        {trendData.length > 0 && (
          <PerformanceTrendChart
            trendData={trendData}
            allSubjects={allSubjects}
            activeSubject={activeSubject}
            onSubjectChange={setActiveSubject}
            height="sm"
          />
        )}

        {/* Summary footer card */}
        {subjectCards.length > 0 && (
          <div className="bg-[#1E3A5F] rounded-2xl p-6 grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                Overall Average
              </p>
              <p className="text-3xl font-black text-white">
                {overallAvg}
                {overallAvg !== "—" ? "%" : ""}
              </p>
              {overallAvg !== "—" && (
                <p className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">
                    trending_up
                  </span>
                  This term
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                Best Subject
              </p>
              {bestSubject ? (
                <>
                  <p className="text-lg font-black text-white flex items-center justify-center gap-1">
                    <span
                      className="material-symbols-outlined text-emerald-400 text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    {bestSubject.subjectName}
                  </p>
                  <p className="text-[11px] text-white/50 mt-1">
                    Scored {bestSubject.marksObtained}/{bestSubject.maxMarks} (
                    {bestSubject.grade})
                  </p>
                </>
              ) : (
                <p className="text-white/50 text-sm">—</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                Needs Improvement
              </p>
              {worstSubject && worstSubject !== bestSubject ? (
                <>
                  <p className="text-lg font-black text-white flex items-center justify-center gap-1">
                    <span
                      className="material-symbols-outlined text-amber-400 text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      warning
                    </span>
                    {worstSubject.subjectName}
                  </p>
                  <p className="text-[11px] text-white/50 mt-1">
                    Focus on the next Unit Test
                  </p>
                </>
              ) : (
                <p className="text-white/50 text-sm">—</p>
              )}
            </div>
          </div>
        )}
      </div>
  );
};

export default ParentExamResults;

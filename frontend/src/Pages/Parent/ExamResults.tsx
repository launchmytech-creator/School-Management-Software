import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useParentChildren, useStudentResults } from "../../hooks/queries";
import { useScrollableTabs } from "../../hooks/useScrollableTabs";
import type { LinkedStudent } from "../../types/parent";
import type { StudentResult } from "../../services/examResultService";
import {
  subjectColor,
} from "../../lib/subject-utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import SubjectCard from "../../components/students/SubjectCard";
import ExamTypeFilter from "../../components/students/ExamTypeFilter";

// ── main ──────────────────────────────────────────────────────────────────────

const EMPTY_CHILDREN: LinkedStudent[] = [];

const ParentExamResults: React.FC = () => {
  const { user } = useAuth();
  const { selectedYear } = useAcademicYear();
  const navigate = useNavigate();

  const { data: childrenData, isLoading: childrenLoading } = useParentChildren(Number(user?.id));
  const children = childrenData || EMPTY_CHILDREN;

  const [selected, setSelected] = useState<LinkedStudent | null>(null);
  const [activeType, setActiveType] = useState("All");
  const [activeSubject, setActiveSubject] = useState("Mathematics");
  const { canScrollLeft, canScrollRight, tabsRef, scrollBy } = useScrollableTabs();

  // set initial child
  useEffect(() => {
    if (children.length > 0 && !selected) {
      setSelected(children[0]);
    }
  }, [children, selected]);

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
          <div className="w-10 h-10 border-4 border-[#4A9FD4] border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  return (
      <div className="p-6 max-w-5xl mx-auto space-y-5 pb-10">
        {/* Back */}
        <button
          onClick={() => navigate("/parent/dashboard")}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Results &amp; Marks
        </button>

        {/* Child tabs */}
        {children.length > 1 && (
          <div className="relative">
            <div ref={tabsRef} className="flex gap-2 overflow-x-auto scrollbar-hide px-10">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                    selected?.id === c.id
                      ? "border-[#4A9FD4] text-[#4A9FD4]"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    account_circle
                  </span>
                  {c.fullName.split(" ")[0]}
                </button>
              ))}
            </div>
            {canScrollLeft && (
              <button
                onClick={() => scrollBy("left")}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center z-20 hover:bg-slate-50 hover:border-slate-300 hover:shadow transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-slate-600" style={{ fontVariationSettings: "'FILL' 1" }}>chevron_left</span>
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scrollBy("right")}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center z-20 hover:bg-slate-50 hover:border-slate-300 hover:shadow transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-slate-600" style={{ fontVariationSettings: "'FILL' 1" }}>chevron_right</span>
              </button>
            )}
          </div>
        )}

        {/* Header */}
        {selected && (
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Marks &amp; Academic Performance
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Viewing report for {selected.fullName.split(" ")[0]} &bull;{" "}
              {selected.className || "N/A"} &bull; {selectedYear?.name || ""}{" "}
              Session
            </p>
          </div>
        )}

        {/* Exam type filter */}
        <ExamTypeFilter
          activeType={activeType}
          onChange={setActiveType}
        />

        {/* Subject cards */}
        {subjectCards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 block mb-3">
              quiz
            </span>
            <p className="text-slate-500 font-semibold">
              No exam results found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Results will appear here once exams are graded.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjectCards.map((r) => (
              <SubjectCard key={r.id} result={r} />
            ))}
          </div>
        )}

        {/* Performance Trend */}
        {trendData.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="font-bold text-slate-900">Performance Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Academic progress over recent examinations
                </p>
              </div>
              <button className="flex items-center gap-1 text-xs font-bold text-[#4A9FD4] hover:underline">
                <span className="material-symbols-outlined text-[14px]">
                  bar_chart
                </span>
                Full Report
              </button>
            </div>

            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                    formatter={(val: number) => [`${val}%`]}
                  />
                  {allSubjects.map((sub) => (
                    <Line
                      key={sub}
                      type="monotone"
                      dataKey={sub}
                      stroke={subjectColor(sub)}
                      strokeWidth={activeSubject === sub ? 3 : 1.5}
                      dot={{
                        r: activeSubject === sub ? 5 : 3,
                        fill: subjectColor(sub),
                      }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Subject legend */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              {allSubjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubject(sub)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                    activeSubject === sub
                      ? "text-white shadow-sm"
                      : "text-slate-500 bg-slate-100 hover:bg-slate-200"
                  }`}
                  style={
                    activeSubject === sub
                      ? { backgroundColor: subjectColor(sub) }
                      : {}
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: subjectColor(sub) }}
                  />
                  {sub}
                </button>
              ))}
            </div>
          </div>
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

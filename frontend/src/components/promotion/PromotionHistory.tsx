import React from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Users,
  Calendar,
  UserCheck,
} from 'lucide-react';
import type { PromotionGroup } from '../../services/promotionService';

interface PromotionHistoryProps {
  promotions: PromotionGroup[];
  expandedGroups: Set<string>;
  showAllStudents: Record<string, boolean>;
  loadingPromotions: boolean;
  onToggleGroup: (key: string) => void;
  onToggleAllGroups: (expand: boolean) => void;
  onToggleShowAllStudents: (key: string) => void;
}

export const PromotionHistory: React.FC<PromotionHistoryProps> = ({
  promotions,
  expandedGroups,
  showAllStudents,
  loadingPromotions,
  onToggleGroup,
  onToggleAllGroups,
  onToggleShowAllStudents,
}) => {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Promotion History
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {promotions.length > 0
                ? `${promotions.length} promotion${promotions.length > 1 ? "s" : ""} recorded`
                : "No promotions yet"}
            </p>
          </div>

          {promotions.length > 0 && (
            <button
              onClick={() => onToggleAllGroups(expandedGroups.size < promotions.length)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
            >
              {expandedGroups.size < promotions.length ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Expand All
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  Collapse All
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {loadingPromotions ? (
        <div className="p-12 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading promotions..." />
        </div>
      ) : promotions.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {promotions.map((group) => {
            const isExpanded = expandedGroups.has(group.key);
            const showAll = showAllStudents[group.key] || false;
            const displayedStudents = showAll
              ? group.students
              : group.students.slice(0, 3);
            const hasMoreStudents = group.students.length > 3;

            return (
              <div key={group.key}>
                <div
                  className={`p-6 cursor-pointer transition-colors ${
                    isExpanded
                      ? "bg-blue-50/50 hover:bg-blue-50"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => onToggleGroup(group.key)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isExpanded
                            ? "bg-blue-500 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg">
                            {group.fromClassName}{" "}
                            {group.fromClassSection &&
                              `- Section ${group.fromClassSection}`}
                          </span>
                          <ArrowRight className="w-5 h-5 text-emerald-500" />
                          <span className="inline-flex px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg">
                            {group.toClassName}{" "}
                            {group.toClassSection &&
                              `- Section ${group.toClassSection}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm mt-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-slate-600">
                              {group.students.length} student
                              {group.students.length > 1 ? "s" : ""}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {new Date(group.promotionDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-500">
                            <UserCheck className="w-4 h-4" />
                            <span className="font-medium">
                              {group.promotedByName || "System"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 ml-14 flex items-center gap-4 text-xs text-slate-500">
                          <span>{group.fromAcademicYear}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="font-medium text-emerald-600">
                            {group.toAcademicYear}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-slate-25 border-t border-slate-100">
                    <div className="p-4 pl-14 space-y-2">
                      {displayedStudents.map((student, idx) => (
                        <div
                          key={student.id}
                          className={`flex items-center gap-4 p-3 rounded-xl ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }`}
                        >
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-black text-sm">
                            {student.studentName?.charAt(0) || "?"}
                          </span>
                          <div className="flex-1">
                            <p className="font-bold text-slate-900">
                              {student.studentName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {student.admissionNumber}
                            </p>
                          </div>
                          {student.rollNumber && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                              Roll: {student.rollNumber}
                            </span>
                          )}
                        </div>
                      ))}

                      {hasMoreStudents && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleShowAllStudents(group.key);
                          }}
                          className="flex items-center gap-2 w-full p-3 text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          {showAll ? (
                            <>
                              <ChevronRight className="w-4 h-4" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show {group.students.length - 3} more student
                              {group.students.length - 3 > 1 ? "s" : ""}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">
            No Promotions Found
          </h3>
          <p className="text-slate-500">
            Student promotions will appear here once they are completed
          </p>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  TrendingUp,
  Check,
  Users,
  BookOpen,
  ArrowUp,
  Calendar,
  X,
} from 'lucide-react';
import type { Class } from '../../types/class';
import type { Student } from '../../types/student';

interface PromotionFormProps {
  classes: Class[];
  nextYearOptions: { id: string; name: string }[];
  filteredToClasses: Class[];
  fromClass: string;
  onFromClassChange: (value: string) => void;
  toClass: string;
  onToClassChange: (value: string) => void;
  toAcademicYear: string;
  onToAcademicYearChange: (value: string) => void;
  classStudents: Student[];
  loadingClasses: boolean;
  loadingNextYearClasses: boolean;
  loadingStudents: boolean;
  onOpenModal: () => void;
  onReset: () => void;
}

export const PromotionForm: React.FC<PromotionFormProps> = ({
  classes,
  nextYearOptions,
  filteredToClasses,
  fromClass,
  onFromClassChange,
  toClass,
  onToClassChange,
  toAcademicYear,
  onToAcademicYearChange,
  classStudents,
  loadingClasses,
  loadingNextYearClasses,
  loadingStudents,
  onOpenModal,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-10 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Promote Students
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Select students to promote to the next grade
          </p>
        </div>
        {(fromClass || toClass) && (
          <button
            onClick={onReset}
            className="text-sm font-bold text-slate-500 hover:text-slate-700 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <BookOpen className="w-4 h-4 text-blue-500" />
            From Class
          </label>
          <div className="relative">
            <select
              value={fromClass}
              onChange={(e) => {
                onFromClassChange(e.target.value);
                onToClassChange("");
              }}
              disabled={loadingClasses}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - Section {cls.section || "A"}
                </option>
              ))}
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <ArrowUp className="w-4 h-4 text-emerald-500" />
            To Class
            {toAcademicYear && (
              <span className="text-xs font-normal text-amber-600">
                (Next Year)
              </span>
            )}
          </label>
          <div className="relative">
            <select
              value={toClass}
              onChange={(e) => onToClassChange(e.target.value)}
              disabled={!fromClass || loadingNextYearClasses}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!fromClass
                  ? "Select From Class first"
                  : loadingNextYearClasses
                    ? "Loading..."
                    : filteredToClasses.length === 0
                      ? "No higher classes available"
                      : "Select Class"}
              </option>
              {filteredToClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - Section {cls.section || "A"}
                </option>
              ))}
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-amber-500" />
            To Academic Year
          </label>
          <div className="relative">
            <select
              value={toAcademicYear}
              onChange={(e) => onToAcademicYearChange(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-slate-700 focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="">Current Year</option>
              {nextYearOptions.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <Button
            onClick={onOpenModal}
            disabled={!fromClass || !toClass || loadingStudents}
            className="flex-1 h-14 rounded-2xl font-black text-sm shadow-lg shadow-blue-500/20"
          >
            <Users className="w-5 h-5 mr-2" />
            Select Students
          </Button>
        </div>
      </div>

      {fromClass && toClass && (
        <div
          className={`mt-6 p-5 rounded-2xl border-2 ${
            classStudents.length > 0
              ? "bg-blue-50 border-blue-200"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          {loadingStudents ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner
                size="sm"
                message="Loading eligible students..."
              />
            </div>
          ) : classStudents.length > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-blue-900">
                    {classStudents.length} students eligible for promotion
                  </p>
                  <p className="text-sm text-blue-600">
                    From {classes.find((c) => c.id === fromClass)?.name} to{" "}
                    {classes.find((c) => c.id === toClass)?.name}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded-xl">
                <Check className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="font-bold text-slate-600">
                  No eligible students
                </p>
                <p className="text-sm text-slate-500">
                  All students from{" "}
                  {classes.find((c) => c.id === fromClass)?.name} have been
                  promoted
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

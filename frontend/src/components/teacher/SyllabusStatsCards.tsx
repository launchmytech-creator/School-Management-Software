import React from "react";
import { BookMarked, BookOpen, CheckCircle, Clock } from "lucide-react";

interface SyllabusStats {
  totalSubjects: number;
  overallPercentage: number;
  completedChapters: number;
  totalChapters: number;
}

interface SyllabusStatsCardsProps {
  stats: SyllabusStats;
}

export const SyllabusStatsCards: React.FC<SyllabusStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{stats.totalSubjects}</p>
            <p className="text-sm text-blue-100">Subjects Assigned</p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <BookMarked className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{stats.overallPercentage}%</p>
            <p className="text-sm text-purple-100">Overall Progress</p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{stats.completedChapters}</p>
            <p className="text-sm text-emerald-100">Chapters Done</p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{stats.totalChapters}</p>
            <p className="text-sm text-slate-100">Total Chapters</p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

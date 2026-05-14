import React from "react";
import { useChapters } from "../../hooks/queries";
import { subjectIcon } from "../../lib/subject-utils";
import { Button } from "../../components/ui/button";
import { ListChecks, ChevronRight } from "lucide-react";
import type { TeacherAllocation } from "../../types/teacher";

interface SubjectCardProps {
  subject: {
    id: string;
    subjectId: number;
    subjectName: string;
  };
  classId: string;
  allocations: TeacherAllocation[];
}

const SubjectIcon: React.FC<{ name: string }> = ({ name }) => {
  const { icon, bg, text } = subjectIcon(name);
  return (
    <div className={`p-2 rounded-lg ${bg}`}>
      <span
        className={`material-symbols-outlined text-lg ${text}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
    </div>
  );
};

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  classId,
  allocations,
}) => {
  const teacher = allocations.find(
    (a) => a.subjectId === subject.subjectId && a.classId === Number(classId),
  );
  const { data: chapters = [] } = useChapters(subject.subjectId);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <SubjectIcon name={subject.subjectName} />
            <h4 className="font-black text-slate-900 text-lg tracking-tight">
              {subject.subjectName}
            </h4>
            <span className="text-xs text-slate-400">
              ({chapters.length} chapters)
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Teacher:{" "}
            <span className="text-slate-600">
              {teacher?.teacherName || "Not Assigned"}
            </span>
          </p>
        </div>
        <ChevronRight className="size-5 text-slate-300" />
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            (window.location.href = `/admin/classes/${classId}/subjects/${subject.subjectId}/chapters`)
          }
          className="gap-2 w-full"
        >
          <ListChecks className="w-4 h-4" />
          Manage Chapters
        </Button>
      </div>
    </div>
  );
};
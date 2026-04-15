export const EXAM_TYPES = ["All", "Class Test", "Unit Test", "Half Yearly", "Final"] as const;
export type ExamType = typeof EXAM_TYPES[number];

export const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#4A9FD4",
  Science: "#22c55e",
  English: "#f97316",
  History: "#ef4444",
  Geography: "#a855f7",
  default: "#64748b",
};

export const subjectColor = (name: string): string =>
  SUBJECT_COLORS[name] || SUBJECT_COLORS.default;

export const gradeColor = (grade: string): string => {
  if (["A+", "A"].includes(grade)) return "text-emerald-600 bg-emerald-50";
  if (["B+", "B"].includes(grade)) return "text-blue-600 bg-blue-50";
  if (["C+", "C"].includes(grade)) return "text-amber-600 bg-amber-50";
  return "text-rose-600 bg-rose-50";
};

export const progressColor = (pct: number): { bar: string; label: string } => {
  if (pct >= 85) return { bar: "bg-emerald-500", label: "EXCELLENT" };
  if (pct >= 70) return { bar: "bg-blue-500", label: "ABOVE AVERAGE" };
  if (pct >= 50) return { bar: "bg-amber-500", label: "GOOD" };
  return { bar: "bg-rose-500", label: "NEEDS ATTENTION" };
};

export const subjectIcon = (
  name: string
): { icon: string; bg: string; text: string } => {
  const n = name.toLowerCase();
  if (n.includes("math"))
    return { icon: "calculate", bg: "bg-blue-100", text: "text-blue-600" };
  if (n.includes("science"))
    return { icon: "science", bg: "bg-green-100", text: "text-green-600" };
  if (n.includes("english"))
    return { icon: "menu_book", bg: "bg-orange-100", text: "text-orange-600" };
  if (n.includes("history"))
    return { icon: "history_edu", bg: "bg-red-100", text: "text-red-600" };
  return { icon: "school", bg: "bg-purple-100", text: "text-purple-600" };
};

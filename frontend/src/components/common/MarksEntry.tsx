import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { useNotification } from "../../context/NotificationContext";
import { classService } from "../../services/classService";
import {
  examService,
  type Exam,
  type ExamSubject,
} from "../../services/examService";
import {
  examResultService,
  type ExamSubjectResult,
} from "../../services/examResultService";
import { useAllStudents } from "../../hooks/queries/useStudents";
import type { Class } from "../../types/class";
import { Save, GraduationCap } from "lucide-react";
import { Button } from "../../components/ui/button";
import { MarksConfirmModal } from "./MarksConfirmModal";
import { MarksRow } from "./MarksRow";

interface StudentMarks {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  rollNumber: string | null;
  marksObtained: string;
  isAbsent: boolean;
  existingResult?: ExamSubjectResult;
}

interface MarksEntryProps {
  layout: "admin" | "accountant";
}

const MarksEntry: React.FC<MarksEntryProps> = ({ layout }) => {
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();

  const isAdmin = layout === "admin";
  const basePath = isAdmin ? "/admin" : "/accountant";

  const [classes, setClasses] = useState<Class[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [studentMarks, setStudentMarks] = useState<StudentMarks[]>([]);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loadingFromUrl, setLoadingFromUrl] = useState(false);

  const { data: allStudents = [] } = useAllStudents();

  const classStudents = useMemo(() => {
    return allStudents.filter(s => s.currentClassId?.toString() === selectedClass);
  }, [allStudents, selectedClass]);

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch {
      showNotification("Failed to fetch classes", "error");
    }
  }, [showNotification]);

  const fetchExams = useCallback(
    async (classId?: number) => {
      try {
        const data = await examService.getExams(classId);
        setExams(data);
      } catch {
        showNotification("Failed to fetch exams", "error");
      }
    },
    [showNotification],
  );

  useEffect(() => {
    if (selectedClass && classStudents.length > 0) {
      const marksData: StudentMarks[] = classStudents.map((s) => ({
        studentId: s.id,
        studentName: s.fullName,
        admissionNumber: s.admissionNumber,
        rollNumber: s.rollNumber ?? null,
        marksObtained: "",
        isAbsent: false,
      }));
      setStudentMarks(marksData);
    } else if (!selectedClass) {
      setStudentMarks([]);
    }
  }, [classStudents, selectedClass]);

  const fetchExistingResults = useCallback(async (examSubjectId: string) => {
    if (!examSubjectId) return;
    try {
      const data = await examResultService.getExamSubjectResults(
        parseInt(examSubjectId),
      );

      setStudentMarks((prev) =>
        prev.map((sm) => {
          const existing = data.find((r) => r.studentId === sm.studentId);
          if (existing) {
            return {
              ...sm,
              marksObtained:
                existing.marksObtained !== null
                  ? existing.marksObtained.toString()
                  : "",
              isAbsent: existing.isAbsent,
              existingResult: existing,
            };
          }
          return sm;
        }),
      );
    } catch {
      // ignore
    }
  }, []);

  const fetchExamDirectly = useCallback(
    async (examId: number) => {
      try {
        setLoadingFromUrl(true);
        const exam = await examService.getExamById(examId);

        setSelectedClass(exam.classId.toString());
        setSelectedExam(exam.id.toString());
        setExamSubjects(exam.subjects || []);

        const marksData: StudentMarks[] = classStudents.map((s) => ({
          studentId: s.id,
          studentName: s.fullName,
          admissionNumber: s.admissionNumber,
          rollNumber: s.rollNumber ?? null,
          marksObtained: "",
          isAbsent: false,
        }));
        setStudentMarks(marksData);

        if (exam.subjects && exam.subjects.length > 0) {
          setSelectedSubject(exam.subjects[0].id.toString());
          const existingResults = await examResultService.getExamSubjectResults(
            exam.subjects[0].id,
          );

          setStudentMarks((prev) =>
            prev.map((sm) => {
              const existing = existingResults.find(
                (r) => r.studentId === sm.studentId,
              );
              if (existing) {
                return {
                  ...sm,
                  marksObtained:
                    existing.marksObtained !== null
                      ? existing.marksObtained.toString()
                      : "",
                  isAbsent: existing.isAbsent,
                  existingResult: existing,
                };
              }
              return sm;
            }),
          );
        }
      } catch {
        showNotification("Failed to load exam data", "error");
      } finally {
        setLoadingFromUrl(false);
      }
    },
    [showNotification],
  );

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    const examIdParam = searchParams.get("examId");
    if (examIdParam) {
      fetchExamDirectly(parseInt(examIdParam));
    }
  }, []);

  useEffect(() => {
    if (!loadingFromUrl && selectedClass) {
      fetchExams(parseInt(selectedClass));
    }
  }, [selectedClass, fetchExams, loadingFromUrl]);

  useEffect(() => {
    if (!loadingFromUrl && selectedSubject) {
      fetchExistingResults(selectedSubject);
    }
  }, [selectedSubject, fetchExistingResults, loadingFromUrl]);

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedExam("");
    setSelectedSubject("");
    setExamSubjects([]);
    setStudentMarks([]);
    if (classId) {
      fetchExams(parseInt(classId));
    }
  };

  const handleExamChange = async (examId: string) => {
    setSelectedExam(examId);
    setSelectedSubject("");

    if (examId) {
      try {
        const examData = await examService.getExamById(parseInt(examId));
        setExamSubjects(examData.subjects || []);
      } catch {
        showNotification("Failed to fetch exam subjects", "error");
        setExamSubjects([]);
      }
    } else {
      setExamSubjects([]);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);

    setStudentMarks((prev) =>
      prev.map((sm) => ({
        ...sm,
        marksObtained: "",
        isAbsent: false,
        existingResult: undefined,
      })),
    );
  };

  const selectedSubjectData = examSubjects.find(
    (s) => s.id.toString() === selectedSubject,
  );

  const calculateGrade = (marks: number, maxMarks: number): string => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B+";
    if (percentage >= 60) return "B";
    if (percentage >= 50) return "C";
    if (percentage >= 40) return "D";
    return "F";
  };

  const handleMarksChange = (studentId: number, value: string) => {
    if (value !== "") {
      const numValue = parseFloat(value);
      const maxMarks = selectedSubjectData?.maxMarks || 100;
      if (isNaN(numValue) || numValue < 0 || numValue > maxMarks) {
        return;
      }
    }
    
    setStudentMarks((prev) =>
      prev.map((sm) => {
        if (sm.studentId === studentId) {
          const newMarks = sm.isAbsent ? "" : value;
          return { ...sm, marksObtained: newMarks };
        }
        return sm;
      }),
    );
  };

  const handleAbsentToggle = (studentId: number) => {
    setStudentMarks((prev) =>
      prev.map((sm) => {
        if (sm.studentId === studentId) {
          return {
            ...sm,
            isAbsent: !sm.isAbsent,
            marksObtained: !sm.isAbsent ? "" : sm.marksObtained,
          };
        }
        return sm;
      }),
    );
  };

  const handleSaveMarks = async () => {
    if (!selectedSubject) {
      showNotification("Please select a subject", "error");
      return;
    }

    const selectedSubjectData = examSubjects.find(
      (s) => s.id.toString() === selectedSubject,
    );
    if (!selectedSubjectData) return;

    const marksData = studentMarks
      .filter((sm) => sm.marksObtained !== "" || sm.isAbsent)
      .map((sm) => ({
        studentId: sm.studentId,
        marksObtained: sm.isAbsent
          ? undefined
          : parseFloat(sm.marksObtained) || 0,
        grade: sm.isAbsent
          ? undefined
          : calculateGrade(
              parseFloat(sm.marksObtained) || 0,
              selectedSubjectData.maxMarks,
            ),
        isAbsent: sm.isAbsent,
      }));

    if (marksData.length === 0) {
      showNotification("Please enter at least one mark", "error");
      return;
    }

    try {
      setSaving(true);
      await examResultService.enterMarks({
        examSubjectId: parseInt(selectedSubject),
        results: marksData,
      });
      showNotification("Marks saved successfully", "success");
      setShowConfirmModal(false);
      fetchExistingResults(selectedSubject);
    } catch {
      showNotification("Failed to save marks", "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedExamData = exams.find((e) => e.id.toString() === selectedExam);

  const renderContent = () => (
    <>
      {isAdmin && (
        <PageHeader
          title="Marks Entry"
          subtitle={
            selectedExamData
              ? `Entering marks for: ${selectedExamData.name}`
              : "Enter and manage student examination marks"
          }
          breadcrumb={{
            links: [
              { label: "Exams", href: `${basePath}/exams` },
              { label: "Marks Entry", active: true },
            ],
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - Section {cls.section || "A"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Exam
          </label>
          <select
            value={selectedExam}
            onChange={(e) => handleExamChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedClass}
          >
            <option value="">Select Exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedExam}
          >
            <option value="">Select Subject</option>
            {examSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subjectName} (Max: {subject.maxMarks})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedClass && selectedExam && selectedSubject ? (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {selectedSubjectData?.subjectName}
                </p>
                <p className="text-sm text-slate-500">
                  Maximum Marks: {selectedSubjectData?.maxMarks}
                </p>
              </div>
              <Button
                onClick={() => setShowConfirmModal(true)}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save Marks
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Admission No
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Marks
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentMarks.map((student) => (
                    <MarksRow
                      key={student.studentId}
                      student={student}
                      maxMarks={selectedSubjectData?.maxMarks || 100}
                      onMarksChange={handleMarksChange}
                      onAbsentToggle={handleAbsentToggle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="Select filters to view students"
          description="Choose a class, exam, and subject to enter marks"
        />
      )}

      <MarksConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSaveMarks}
        studentMarks={studentMarks}
        loading={saving}
      />
    </>
  );

  return <div className="space-y-6 pb-12">{renderContent()}</div>;
};

export default MarksEntry;

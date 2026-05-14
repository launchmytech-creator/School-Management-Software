import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { useNotification } from "../../context/NotificationContext";
import { useAllStudents } from "../../hooks/queries/useStudents";
import { useClasses } from "../../hooks/queries/useClasses";
import { useExams, useExamById } from "../../hooks/queries/useExams";
import { useExamSubjectResults, useEnterMarks } from "../../hooks/queries/useExamResults";
import type { ExamSubject } from "../../services/examService";
import type { ExamSubjectResult } from "../../services/examResultService";
import { Save, GraduationCap } from "lucide-react";
import { Button } from "../../components/ui/button";
import { MarksConfirmModal } from "../../components/modals/MarksConfirmModal";
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

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [studentMarks, setStudentMarks] = useState<StudentMarks[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: allStudents = [] } = useAllStudents();
  const { data: classesData = [] } = useClasses();
  const { data: examsData = [] } = useExams({ classId: selectedClass ? parseInt(selectedClass) : undefined });

  const examIdParam = searchParams.get("examId");
  const { data: selectedExamData, isLoading: loadingExam } = useExamById(
    examIdParam ? parseInt(examIdParam) : selectedExam ? parseInt(selectedExam) : 0
  );

  const { data: existingResults = [], refetch: refetchResults } = useExamSubjectResults(
    selectedSubject ? parseInt(selectedSubject) : 0
  );

  const enterMarks = useEnterMarks();

  const classStudents = useMemo(() => {
    return allStudents.filter(
      (s) => s.currentClassId?.toString() === selectedClass,
    );
  }, [allStudents, selectedClass]);

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

  useEffect(() => {
    if (examIdParam && selectedExamData) {
      setSelectedClass(selectedExamData.classId.toString());
      setSelectedExam(selectedExamData.id.toString());
      setExamSubjects(selectedExamData.subjects || []);
      if (selectedExamData.subjects && selectedExamData.subjects.length > 0) {
        setSelectedSubject(selectedExamData.subjects[0].id.toString());
      }
    }
  }, [examIdParam, selectedExamData]);

  useEffect(() => {
    if (!loadingExam && selectedExam && selectedExamData) {
      setExamSubjects(selectedExamData.subjects || []);
    }
  }, [loadingExam, selectedExam, selectedExamData]);

  useEffect(() => {
    if (!loadingExam && selectedSubject && existingResults.length >= 0) {
      setStudentMarks((prev) =>
        prev.map((sm) => {
          const existing = existingResults.find((r) => r.studentId === sm.studentId);
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
  }, [selectedSubject, existingResults, loadingExam]);

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedExam("");
    setSelectedSubject("");
    setExamSubjects([]);
    setStudentMarks([]);
  };

  const handleExamChange = (examId: string) => {
    setSelectedExam(examId);
    setSelectedSubject("");
    setExamSubjects([]);
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

    const selectedSubjectDataItem = examSubjects.find(
      (s) => s.id.toString() === selectedSubject,
    );
    if (!selectedSubjectDataItem) return;

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
              selectedSubjectDataItem.maxMarks,
            ),
        isAbsent: sm.isAbsent,
      }));

    if (marksData.length === 0) {
      showNotification("Please enter at least one mark", "error");
      return;
    }

    try {
      await enterMarks.mutateAsync({
        examSubjectId: parseInt(selectedSubject),
        results: marksData,
      });
      showNotification("Marks saved successfully", "success");
      setShowConfirmModal(false);
      refetchResults();
    } catch {
      showNotification("Failed to save marks", "error");
    }
  };

  const displayExamData = selectedExamData || examsData.find((e) => e.id.toString() === selectedExam);

  const renderContent = () => (
    <>
      {isAdmin && (
        <PageHeader
          title="Marks Entry"
          subtitle={
            displayExamData
              ? `Entering marks for: ${displayExamData.name}`
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
            {classesData.map((cls) => (
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
            {examsData.map((exam) => (
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
        loading={enterMarks.isPending}
      />
    </>
  );

  return <div className="space-y-6 pb-12">{renderContent()}</div>;
};

export default MarksEntry;
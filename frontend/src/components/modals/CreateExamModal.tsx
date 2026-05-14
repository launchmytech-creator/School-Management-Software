import React, { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { Button } from "../ui/button";
import InputField from "../ui/InputField";
import { X, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EXAM_TYPE_OPTIONS } from "../../lib/subject-utils";
import { subjectService, type ClassSubject } from "../../services/subjectService";
import type { Class } from "../../types/class";

interface SubjectFormItem {
  subjectId: number;
  subjectName: string;
  maxMarks: string;
  examDate: string;
}

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    classId: number;
    academicYearId: number;
    examType?: string;
    startDate: string;
    endDate: string;
    weightage?: number;
    subjects: { subjectId: number; maxMarks: number; examDate?: string }[];
  }) => Promise<void>;
  classes: Class[];
  academicYearId: number;
  loading?: boolean;
  preSelectedClassId?: number;
}

const createExamSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  classId: z.string().min(1, "Class is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  examType: z.string().optional(),
  weightage: z.string().optional(),
});

export const CreateExamModal: React.FC<CreateExamModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  classes,
  academicYearId,
  loading = false,
  preSelectedClassId,
}) => {
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectFormItem[]>([]);
  const [showError, setShowError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof createExamSchema>>({
    resolver: zodResolver(createExamSchema),
  });

  useEffect(() => {
    if (isOpen && preSelectedClassId) {
      setValue('classId', String(preSelectedClassId));
    }
  }, [isOpen, preSelectedClassId, setValue]);

  const selectedClassId = watch("classId");

  useEffect(() => {
    if (selectedClassId) {
      subjectService.getSubjectsByClass(parseInt(selectedClassId))
        .then(setClassSubjects)
        .catch(() => setClassSubjects([]));
    } else {
      setClassSubjects([]);
    }
    setSelectedSubjects([]);
  }, [selectedClassId]);

  const handleAddSubject = (subjectId: number) => {
    const subject = classSubjects.find((s) => s.subjectId === subjectId);
    if (!subject) return;
    if (selectedSubjects.some((s) => s.subjectId === subjectId)) return;
    setSelectedSubjects((prev) => [
      ...prev,
      { subjectId, subjectName: subject.subjectName, maxMarks: "100", examDate: "" },
    ]);
  };

  const handleRemoveSubject = (subjectId: number) => {
    setSelectedSubjects((prev) => prev.filter((s) => s.subjectId !== subjectId));
  };

  const handleSubjectChange = (
    subjectId: number,
    field: "maxMarks" | "examDate",
    value: string
  ) => {
    setSelectedSubjects((prev) =>
      prev.map((s) => (s.subjectId === subjectId ? { ...s, [field]: value } : s))
    );
  };

  const handleClose = () => {
    reset();
    setSelectedSubjects([]);
    setClassSubjects([]);
    setShowError("");
    onClose();
  };

  const onFormSubmit = async (data: z.infer<typeof createExamSchema>) => {
    if (selectedSubjects.length === 0) {
      setShowError("Add at least one subject");
      return;
    }
    setShowError("");
    try {
      await onSubmit({
        name: data.name,
        classId: parseInt(data.classId),
        academicYearId,
        examType: data.examType,
        startDate: data.startDate,
        endDate: data.endDate,
        weightage: data.weightage ? parseInt(data.weightage) : undefined,
        subjects: selectedSubjects.map((s) => ({
          subjectId: s.subjectId,
          maxMarks: parseFloat(s.maxMarks) || 100,
          examDate: s.examDate || undefined,
        })),
      });
      handleClose();
    } catch {
      setShowError("Failed to create exam");
    }
  };

  const availableSubjects = classSubjects.filter(
    (cs) => !selectedSubjects.some((s) => s.subjectId === cs.subjectId)
  );

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Create New Exam" size="lg">
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <InputField
              label="Exam Name"
              placeholder="e.g., Half Yearly Examination"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          <div className="col-span-2">
            <div className="flex justify-between items-center px-1">
              <label className={`block text-xs font-semibold ${errors.classId ? "text-red-500" : "text-slate-700"}`}>
                Class
              </label>
              {errors.classId && <span className="text-[10px] font-bold text-red-500">{errors.classId.message}</span>}
            </div>
            <select
              disabled={!!preSelectedClassId}
              className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 ${
                errors.classId ? "border-red-500 bg-red-50/30 focus:ring-red-500/10" : "border border-slate-200 focus:ring-blue-500"
              } ${preSelectedClassId ? "bg-slate-100 cursor-not-allowed" : ""}`}
              {...register("classId")}
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
            <label className="block text-sm font-bold text-slate-700 mb-2">Exam Type</label>
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("examType")}
            >
              <option value="">Select Type (Optional)</option>
              {EXAM_TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <InputField
              label="Weightage (%)"
              type="number"
              placeholder="e.g., 50"
              {...register("weightage")}
            />
          </div>

          <div>
            <InputField
              label="Start Date"
              type="date"
              error={errors.startDate?.message}
              {...register("startDate")}
            />
          </div>

          <div>
            <InputField
              label="End Date"
              type="date"
              error={errors.endDate?.message}
              {...register("endDate")}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-bold text-slate-700">
                Subjects <span className="text-red-500">*</span>
              </label>
            </div>
            <span className="text-xs text-slate-500">
              {selectedSubjects.length} subject(s) added
            </span>
          </div>

          <div className="col-span-2">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) handleAddSubject(parseInt(e.target.value));
              }}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-full"
            >
              <option value="">Add a subject...</option>
              {availableSubjects.map((cs) => (
                <option key={cs.subjectId} value={cs.subjectId}>
                  {cs.subjectName}
                </option>
              ))}
            </select>
          </div>

          {availableSubjects.length === 0 && selectedSubjects.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mt-4">
              <AlertCircle className="w-4 h-4" />
              No subjects assigned to this class. Please assign subjects first.
            </div>
          )}

          {selectedSubjects.length > 0 && (
            <div className="space-y-3 mt-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Selected Subjects
              </div>
              {selectedSubjects.map((subject) => (
                <div
                  key={subject.subjectId}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-700 text-sm">{subject.subjectName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <input
                        type="number"
                        placeholder="Max"
                        value={subject.maxMarks}
                        onChange={(e) => handleSubjectChange(subject.subjectId, "maxMarks", e.target.value)}
                        className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                      <p className="text-[10px] text-slate-400 text-center mt-0.5">Max Marks</p>
                    </div>
                    <div>
                      <input
                        type="date"
                        value={subject.examDate}
                        onChange={(e) => handleSubjectChange(subject.subjectId, "examDate", e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[10px] text-slate-400 text-center mt-0.5">Exam Date</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(subject.subjectId)}
                      className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4" />
            {showError}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Create Exam
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

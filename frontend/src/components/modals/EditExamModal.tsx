import React, { useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { Button } from "../ui/button";
import InputField from "../ui/InputField";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EXAM_TYPE_OPTIONS } from "../../lib/subject-utils";

interface EditExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    examType?: string;
    startDate: string;
    endDate: string;
    weightage?: number;
  }) => Promise<void>;
  exam: { id: number; name: string; examType?: string; startDate: string; endDate: string; weightage?: number } | null;
  hasResults: boolean;
  loading?: boolean;
}

const editExamSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  examType: z.string().optional(),
  weightage: z.string().optional(),
});

export const EditExamModal: React.FC<EditExamModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  exam,
  hasResults,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof editExamSchema>>({
    resolver: zodResolver(editExamSchema),
  });

  useEffect(() => {
    if (exam) {
      reset({
        name: exam.name,
        examType: exam.examType || "",
        startDate: exam.startDate,
        endDate: exam.endDate,
        weightage: exam.weightage?.toString() || "",
      });
    }
  }, [exam, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onFormSubmit = async (data: z.infer<typeof editExamSchema>) => {
    try {
      await onSubmit({
        name: data.name,
        examType: data.examType,
        startDate: data.startDate,
        endDate: data.endDate,
        weightage: data.weightage ? parseInt(data.weightage) : undefined,
      });
      handleClose();
    } catch {
      // Error handled by parent
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Edit Exam" size="lg">
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
      >
        {hasResults && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>This exam already has submitted results. You can only edit basic details.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <InputField
              label="Exam Name"
              placeholder="e.g., Half Yearly Examination"
              error={errors.name?.message}
              {...register("name")}
            />
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

          <div className="col-span-2 flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-slate-400" />
            <span>Class and subjects cannot be changed after exam creation.</span>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Update Exam
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

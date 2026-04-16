import React from "react";
import { BaseModal } from "../common/BaseModal";
import { Button } from "../ui/button";
import InputField from "../ui/InputField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createChapterSchema, type CreateChapterFormData } from "../../schemas/subject.schema";

interface AddChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChapterFormData) => Promise<void>;
  loading?: boolean;
}

export const AddChapterModal: React.FC<AddChapterModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateChapterFormData>({
    resolver: zodResolver(createChapterSchema),
    defaultValues: {
      name: "",
      sequenceNumber: undefined,
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Add New Chapter" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <InputField
          label="Chapter Name"
          placeholder="e.g., Chapter 1 - Introduction"
          {...register("name")}
          error={errors.name?.message}
        />
        <InputField
          label="Sequence Number (optional)"
          type="number"
          placeholder="e.g., 1"
          {...register("sequenceNumber", { valueAsNumber: true })}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Add Chapter
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

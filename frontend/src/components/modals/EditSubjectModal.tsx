import React, { useState, useEffect } from "react";
import { BaseModal } from "./BaseModal";
import { Button } from "../ui/button";
import InputField from "../ui/InputField";
import { subjectService } from "../../services/subjectService";

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: number;
  currentName: string;
  currentCode: string;
  onSuccess: () => void;
}

const EditSubjectModal: React.FC<EditSubjectModalProps> = ({
  isOpen,
  onClose,
  subjectId,
  currentName,
  currentCode,
  onSuccess,
}) => {
  const [name, setName] = useState(currentName);
  const [code, setCode] = useState(currentCode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setName(currentName);
    setCode(currentCode);
    setError(undefined);
  }, [currentName, currentCode, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError("Subject name is required");
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await subjectService.updateSubject(subjectId, {
        name: name.trim(),
        code: code.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update subject");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Subject" size="sm">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <InputField
          label="Subject Name"
          placeholder="Enter subject name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
          error={error}
        />
        <InputField
          label="Subject Code"
          placeholder="e.g., MATH101"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={saving} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default EditSubjectModal;

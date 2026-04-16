import React, { useState, useMemo } from "react";
import { BaseModal } from "../common/BaseModal";
import { Button } from "../ui/button";
import InputField from "../ui/InputField";
import { Check, X, AlertCircle } from "lucide-react";
import type { Subject } from "../../services/subjectService";
import type { Class } from "../../types/class";

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    subjectId?: number;
    name: string;
    code: string;
    classIds: string[];
  }) => Promise<void>;
  allSubjects: Subject[];
  classes: Class[];
  existingClassSubjectIds: Set<number>;
  loading?: boolean;
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allSubjects,
  classes,
  existingClassSubjectIds,
  loading = false,
}) => {
  const [name, setName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [codeEditedManually, setCodeEditedManually] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedExistingSubject, setSelectedExistingSubject] = useState<Subject | null>(null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [classesError, setClassesError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const isNewSubject = !selectedExistingSubject;

  const suggestions = useMemo(() => {
    if (!name.trim()) return [];
    return allSubjects
      .filter((s) => s.name.toLowerCase().includes(name.toLowerCase()))
      .slice(0, 10);
  }, [allSubjects, name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setSelectedExistingSubject(null);

    if (!codeEditedManually && value.trim()) {
      const code = value
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .substring(0, 6);
      setSubjectCode(code);
    }

    if (value.trim()) {
      setNameError(undefined);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubjectCode(e.target.value.toUpperCase());
    setCodeEditedManually(true);
  };

  const handleSelectExisting = (subject: Subject) => {
    setSelectedExistingSubject(subject);
    setName(subject.name);
    setSubjectCode(subject.code || "");
    setCodeEditedManually(true);
    setShowSuggestions(false);
    setNameError(undefined);
  };

  const handleClearSelection = () => {
    setSelectedExistingSubject(null);
    setName("");
    setSubjectCode("");
    setCodeEditedManually(false);
  };

  const isClassAssigned = (classId: string) => {
    if (!selectedExistingSubject) return false;
    const key = parseInt(classId) * 1000 + selectedExistingSubject.id;
    return existingClassSubjectIds.has(key);
  };

  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) => {
      if (prev.includes(classId)) return prev.filter((c) => c !== classId);
      return [...prev, classId];
    });
    if (selectedClasses.length === 0 || selectedClasses.length > 0) {
      setClassesError(undefined);
    }
  };

  const selectAll = () => {
    const unassigned = classes
      .map((c) => c.id)
      .filter((id) => !isClassAssigned(id) && !selectedClasses.includes(id));
    setSelectedClasses((prev) => [...new Set([...prev, ...unassigned])]);
    setClassesError(undefined);
  };

  const clearAll = () => {
    setSelectedClasses([]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    let hasError = false;

    if (!name.trim()) {
      setNameError("Subject name is required");
      hasError = true;
    }

    if (selectedClasses.length === 0) {
      setClassesError("Please select at least one class");
      hasError = true;
    }

    if (hasError) return;

    setIsSaving(true);
    try {
      await onSubmit({
        subjectId: selectedExistingSubject?.id,
        name: name.trim(),
        code: subjectCode.trim(),
        classIds: selectedClasses,
      });
      handleClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName("");
    setSubjectCode("");
    setCodeEditedManually(false);
    setSelectedClasses([]);
    setShowSuggestions(false);
    setSelectedExistingSubject(null);
    setNameError(undefined);
    setClassesError(undefined);
    setIsSaving(false);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Add Subject to Classes" size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="relative">
          <InputField
            label="Subject Name"
            placeholder="Type to search or create new subject..."
            value={name}
            onChange={handleNameChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            error={nameError}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
              <div className="p-2">
                <p className="text-xs text-slate-500 font-medium px-2 py-1">Existing Subjects</p>
                {suggestions.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectExisting(subject);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{subject.name}</p>
                      <p className="text-xs text-slate-500">{subject.code}</p>
                    </div>
                    <Check className="w-4 h-4 text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedExistingSubject && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">
                Using existing: {selectedExistingSubject.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 hover:bg-blue-100 rounded"
            >
              <X className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        )}

        <InputField
          label="Subject Code"
          placeholder="e.g., 10A-MATH"
          value={subjectCode}
          onChange={handleCodeChange}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-700">Assign to Classes</label>
            <div className="flex gap-2">
              <button type="button" onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-700">
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button type="button" onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-600">
                Clear
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg max-h-48 overflow-auto">
            {classes.map((cls) => {
              const isSelected = selectedClasses.includes(cls.id);
              const assigned = isClassAssigned(cls.id);

              return (
                <div
                  key={cls.id}
                  onClick={() => !assigned && toggleClass(cls.id)}
                  className={`p-3 flex items-center gap-3 border-b border-slate-100 last:border-b-0 cursor-pointer transition-colors ${
                    assigned ? "bg-slate-50 cursor-not-allowed" : isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      assigned ? "border-slate-300 bg-slate-200" : isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${assigned ? "text-slate-500" : "text-slate-800"}`}>
                      Class {cls.name} - Section {cls.section || "A"}
                    </p>
                  </div>
                  {assigned && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      Already assigned
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {selectedClasses.length === 0 && classesError && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {classesError}
            </p>
          )}

          <p className="text-xs text-slate-500 mt-2">
            {selectedClasses.length} class(es) selected
            {selectedExistingSubject && ` for "${selectedExistingSubject.name}"`}
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isSaving || loading} className="flex-1">
            {isNewSubject ? "Create & Assign" : "Assign to Classes"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

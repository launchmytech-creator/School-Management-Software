import React from 'react';
import { BaseModal } from '../modals/BaseModal';
import { Button } from '../ui/button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ArrowRight, Search, CheckSquare, Square } from 'lucide-react';
import type { Student } from '../../types/student';
import type { Class } from '../../types/class';

interface StudentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: number[];
  filteredStudents: Student[];
  loadingStudents: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onToggleStudent: (studentId: number) => void;
  onToggleAll: () => void;
  onConfirm: () => void;
  confirming: boolean;
  classes: Class[];
  fromClass: string;
  toClass: string;
}

export const StudentSelectionModal: React.FC<StudentSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  filteredStudents,
  loadingStudents,
  searchQuery,
  onSearchChange,
  onToggleStudent,
  onToggleAll,
  onConfirm,
  confirming,
  classes,
  fromClass,
  toClass,
}) => {
  const handleClose = () => {
    onSearchChange("");
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Select Students from ${classes.find((c) => c.id === fromClass)?.name || "Class"}`}
      size="lg"
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
          <ArrowRight className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-blue-700">
            Promoting to:{" "}
            <strong>
              {classes.find((c) => c.id === toClass)?.name || "Class"}
            </strong>
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or admission number..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
          <p className="text-sm font-bold text-blue-700">
            {selectedStudents.length} of {filteredStudents.length} selected
          </p>
          <button
            onClick={onToggleAll}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            {selectedStudents.length === filteredStudents.length ? (
              <>
                <Square className="w-4 h-4" />
                Deselect All
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4" />
                Select All
              </>
            )}
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {loadingStudents ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" message="Loading students..." />
            </div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <label
                key={student.id}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                  selectedStudents.includes(student.id)
                    ? "bg-blue-50 border-2 border-blue-300"
                    : "bg-slate-50 hover:bg-slate-100 border-2 border-transparent"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selectedStudents.includes(student.id)
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {selectedStudents.includes(student.id) ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {student.fullName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {student.admissionNumber}
                    {student.rollNumber && ` • Roll: ${student.rollNumber}`}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => onToggleStudent(student.id)}
                  className="sr-only"
                />
              </label>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">No students found</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            loading={confirming}
            disabled={selectedStudents.length === 0}
            className="flex-1"
          >
            Promote {selectedStudents.length} Student{selectedStudents.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

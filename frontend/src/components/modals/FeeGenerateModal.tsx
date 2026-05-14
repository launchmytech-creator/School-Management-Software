import React from 'react';
import { BaseModal } from './BaseModal';
import { formatCurrency, getFeeTermsLabel } from '../../lib/utils';
import type { FeeStructureGroup } from '../../services/feeStructureService';
import type { Class } from '../../types/class';
import type { AcademicYear } from '../../types/academicYear';

interface GenerationResult {
  feeTerms: number;
  totalAnnualFee: number;
  perTermAmount: number;
  termBreakdown: Record<string, number>;
  generated: number;
  skippedStudents: number;
}

interface FeeGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  generateData: { classId: number; academicYearId: number };
  onGenerateDataChange: (data: { classId: number; academicYearId: number }) => void;
  onGenerate: () => Promise<void>;
  generating: boolean;
  generationResult: GenerationResult | null;
  classes: Class[];
  academicYears: AcademicYear[];
  groupedStructures: FeeStructureGroup[];
}

const FeeGenerateModal: React.FC<FeeGenerateModalProps> = ({
  isOpen,
  onClose,
  generateData,
  onGenerateDataChange,
  onGenerate,
  generating,
  generationResult,
  classes,
  academicYears,
  groupedStructures,
}) => {
  const selectedGroup = groupedStructures.find(
    (g) => g.classId === generateData.classId && g.academicYearId === generateData.academicYearId
  );

  const handleClassChange = (classId: number) => {
    const group = groupedStructures.find((g) => g.classId === classId);
    onGenerateDataChange({
      classId,
      academicYearId: group?.academicYearId || 0,
    });
  };

  const handleYearChange = (academicYearId: number) => {
    onGenerateDataChange({
      ...generateData,
      academicYearId,
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Fee Transactions"
      size="md"
    >
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Class
            </label>
            <select
              value={generateData.classId || ''}
              onChange={(e) => handleClassChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">Select Class</option>
              {classes.map((cls: Class) => {
                const hasStructure = groupedStructures.some((g) => g.classId === parseInt(cls.id));
                return (
                  <option key={cls.id} value={cls.id} disabled={!hasStructure}>
                    {cls.name} {cls.section && `- ${cls.section}`}
                    {!hasStructure && ' (No fee structure)'}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Academic Year
            </label>
            <select
              value={generateData.academicYearId || ''}
              onChange={(e) => handleYearChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              disabled={!generateData.classId}
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedGroup && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Fee Structure Preview</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Class:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {selectedGroup.className}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Fee Terms:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {getFeeTermsLabel(selectedGroup.feeTerms)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Components:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {selectedGroup.components.length}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Annual Fee:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {formatCurrency(selectedGroup.totalAnnualFee)}
                </span>
              </div>
            </div>
          </div>
        )}

        {generationResult && (
          <div className="bg-emerald-50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-emerald-800">Generation Complete</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-emerald-600">Generated:</span>
                <span className="ml-2 font-medium text-emerald-900">
                  {generationResult.generated} transactions
                </span>
              </div>
              {generationResult.skippedStudents > 0 && (
                <div>
                  <span className="text-emerald-600">Skipped:</span>
                  <span className="ml-2 font-medium text-emerald-900">
                    {generationResult.skippedStudents} students
                  </span>
                </div>
              )}
              <div>
                <span className="text-emerald-600">Per Term:</span>
                <span className="ml-2 font-medium text-emerald-900">
                  {formatCurrency(generationResult.perTermAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={onGenerate}
            disabled={generating || !generateData.classId || !generateData.academicYearId}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Transactions'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export { FeeGenerateModal };

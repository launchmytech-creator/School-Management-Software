import React from 'react';
import { ChevronDown, ChevronUp, Edit2, Trash2, Calendar } from 'lucide-react';
import type { FeeStructureGroup } from '../../services/feeStructureService';
import { formatCurrency, getFeeTermsLabel } from '../../lib/utils';

interface FeeStructureGroupCardProps {
  group: FeeStructureGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (componentId: number) => void;
  onDelete: (componentId: number) => void;
  onDeleteGroup: () => void;
}

const FeeStructureGroupCard: React.FC<FeeStructureGroupCardProps> = ({
  group,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onDeleteGroup,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h4 className="font-semibold text-slate-900">
              {group.className}
              {group.classSection && ` - ${group.classSection}`}
            </h4>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{group.academicYearName}</span>
              <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">
                {getFeeTermsLabel(group.feeTerms)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(group.totalAnnualFee)}
            </p>
            <p className="text-xs text-slate-500">
              {group.components.length} component{group.components.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteGroup();
            }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fee Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Annual Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Per Term
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {group.components.map((component) => (
                <tr key={component.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {component.feeType}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">
                    {formatCurrency(component.annualAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-right">
                    {formatCurrency(component.annualAmount / group.feeTerms)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(component.id)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => onDelete(component.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export { FeeStructureGroupCard };

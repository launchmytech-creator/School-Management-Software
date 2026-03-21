import React from 'react';
import { type ClassProgress } from '../../services/syllabusService';
import { BookMarked } from 'lucide-react';

interface SyllabusCompletionProps {
  items: ClassProgress[];
}

const SyllabusCompletion: React.FC<SyllabusCompletionProps> = ({ items }) => {
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const displayItems = items.slice(0, 5);

  if (items.length === 0) {
    return (
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col min-h-[300px]">
        <h3 className="text-lg font-display font-bold text-slate-800 tracking-tight mb-8">Syllabus Completion</h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No syllabus data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
      <h3 className="text-lg font-display font-bold text-slate-800 tracking-tight mb-8">Syllabus Completion</h3>
      
      <div className="space-y-8 flex-1">
        {displayItems.map((item) => {
          const color = getProgressColor(item.overallPercentage);
          const displayName = item.classSection 
            ? `${item.className} - Section ${item.classSection}`
            : item.className;
          
          return (
            <div key={item.classId} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-800 font-bold text-sm tracking-tight">{displayName}</span>
                <span className="text-accent font-black text-sm">{item.overallPercentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${item.overallPercentage}%`,
                    backgroundColor: color 
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {items.length > 5 && (
        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <span className="text-sm text-slate-500">+{items.length - 5} more classes</span>
        </div>
      )}
    </div>
  );
};

export default SyllabusCompletion;

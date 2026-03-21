import React from 'react';

interface SyllabusCompletionProps {
  items: {
    className: string;
    percentage: number;
    color: string;
  }[];
}

const SyllabusCompletion: React.FC<SyllabusCompletionProps> = ({ items }) => {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
      <h3 className="text-lg font-display font-bold text-slate-800 tracking-tight mb-8">Syllabus Completion</h3>
      
      <div className="space-y-8 flex-1">
        {items.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-800 font-bold text-sm tracking-tight">{item.className}</span>
              <span className="text-accent font-black text-sm">{item.percentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${item.percentage}%`,
                  backgroundColor: item.color 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyllabusCompletion;

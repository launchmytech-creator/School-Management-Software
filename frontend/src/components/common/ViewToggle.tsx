import React from 'react';
import { LayoutGrid, List as ListIcon } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onToggle: (mode: 'grid' | 'list') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onToggle }) => {
  return (
    <div className="flex bg-slate-100 p-1 rounded-xl">
      <button 
        onClick={() => onToggle('grid')}
        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
        title="Grid View"
      >
        <LayoutGrid className="size-5" />
      </button>
      <button 
        onClick={() => onToggle('list')}
        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
        title="List View"
      >
        <ListIcon className="size-5" />
      </button>
    </div>
  );
};

export default ViewToggle;

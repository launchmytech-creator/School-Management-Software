import React from "react";

export interface Tab {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  variant?: "solid" | "gradient";
  className?: string;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  active,
  onChange,
  variant = "solid",
  className = "",
}) => {
  return (
    <div
      className={`bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-2 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const activeClass =
          variant === "gradient"
            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20"
            : "bg-blue-500 text-white shadow-lg shadow-blue-500/20";
        const inactiveClass =
          variant === "gradient"
            ? "text-slate-400 hover:text-slate-600 hover:bg-slate-50 whitespace-nowrap"
            : "text-slate-400 hover:text-slate-600";

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex-1 py-3 px-6 rounded-2xl text-[13px] font-black transition-all ${
              isActive ? activeClass : inactiveClass
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;

import React from "react";
import { Users, Search, Plus, User, X, Mail, Phone, Calendar, MapPin, Shield } from "lucide-react";
import type { Parent } from "../../types/parent";

interface NewParentData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: string;
}

interface ParentSectionProps {
  parents: Parent[];
  filteredParents: Parent[];
  selectedParent: Parent | null;
  newParentData: NewParentData;
  showNewParentForm: boolean;
  showParentDropdown: boolean;
  parentSearch: string;
  fetchingData: boolean;
  onSearchChange: (value: string) => void;
  onParentSelect: (parentId: string) => void;
  onAddNewParent: () => void;
  onCancelNewParent: () => void;
  onNewParentChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onClearSelectedParent: () => void;
  onDropdownToggle: (open: boolean) => void;
  onDropdownClose: () => void;
}

export const ParentSection: React.FC<ParentSectionProps> = ({
  parents,
  selectedParent,
  newParentData,
  showNewParentForm,
  showParentDropdown,
  parentSearch,
  fetchingData,
  onSearchChange,
  onParentSelect,
  onAddNewParent,
  onCancelNewParent,
  onNewParentChange,
  onClearSelectedParent,
  onDropdownToggle,
  onDropdownClose,
}) => {
  return (
    <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-50">
        <div className="bg-emerald-50 p-2 rounded-xl">
          <Users className="text-emerald-500 size-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Parent / Guardian Details</h2>
      </div>

      <div className="mb-6">
        {!showNewParentForm && !selectedParent && (
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search parent by name, email or phone..."
                  value={parentSearch}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    onDropdownToggle(true);
                  }}
                  onFocus={() => onDropdownToggle(true)}
                  disabled={fetchingData}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={onAddNewParent}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add New
              </button>
            </div>

            {showParentDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                {parents.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">
                    No parents available
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                      {parentSearch ? `Results for "${parentSearch}"` : "All Parents"}
                    </div>
                    {parents.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onParentSelect(String(p.id));
                          onDropdownClose();
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-b-0 flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{p.fullName}</div>
                          <div className="text-xs text-slate-500">
                            {p.email} {p.phone ? `• ${p.phone}` : ""}
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {fetchingData && (
          <p className="text-[10px] text-emerald-500 font-bold animate-pulse mt-2">
            Loading parents...
          </p>
        )}
      </div>

      {selectedParent && !showNewParentForm && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{selectedParent.fullName}</h3>
                <p className="text-sm text-emerald-600 font-medium">Selected Parent</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClearSelectedParent}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-emerald-500" />
              <span>{selectedParent.email}</span>
            </div>
            {selectedParent.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>{selectedParent.phone}</span>
              </div>
            )}
            {selectedParent.dateOfBirth && (
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>
                  {new Date(selectedParent.dateOfBirth).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {selectedParent.gender && (
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-4 h-4 text-emerald-500" />
                <span className="capitalize">{selectedParent.gender}</span>
              </div>
            )}
            {selectedParent.address && (
              <div className="col-span-2 flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>{selectedParent.address}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {showNewParentForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Add New Parent</h3>
                <p className="text-sm text-amber-600">Fill in the details below</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancelNewParent}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={newParentData.fullName}
                  onChange={onNewParentChange}
                  placeholder="e.g. John Parent"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={newParentData.email}
                  onChange={onNewParentChange}
                  placeholder="parent@example.com"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="password"
                    value={newParentData.password}
                    onChange={onNewParentChange}
                    placeholder="Enter password for parent login"
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={newParentData.phone}
                  onChange={onNewParentChange}
                  placeholder="9876543210"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={newParentData.dateOfBirth}
                  onChange={onNewParentChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Gender
                </label>
                <select
                  name="gender"
                  value={newParentData.gender}
                  onChange={onNewParentChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Address
              </label>
              <textarea
                name="address"
                rows={3}
                value={newParentData.address}
                onChange={onNewParentChange}
                placeholder="123 Main Street, City"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {!showNewParentForm && !selectedParent && (
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      )}

      {!showNewParentForm && !selectedParent && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-500">
            Search for an existing parent or add a new parent
          </p>
        </div>
      )}
    </div>
  );
};

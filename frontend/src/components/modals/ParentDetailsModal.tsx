import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Link2,
  Unlink2,
  Loader2,
  GraduationCap,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { Button } from "../ui/button";
import { parentService } from "../../services/parentService";
import type { Parent, LinkedStudent } from "../../types/parent";
import { useNotification } from "../../context/NotificationContext";
import LinkStudentModal from "./LinkStudentModal";
import { ConfirmDialog } from "./ConfirmDialog";

interface ParentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: Parent | null;
  onUpdate: () => void;
}

const ParentDetailsModal: React.FC<ParentDetailsModalProps> = ({
  isOpen,
  onClose,
  parent,
  onUpdate,
}) => {
  const { showNotification } = useNotification();
  const [children, setChildren] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState<number | null>(null);
  const [unlinkDialog, setUnlinkDialog] = useState({
    isOpen: false,
    studentId: null as number | null,
  });

  const fetchChildren = React.useCallback(async () => {
    if (!parent) return;
    setLoading(true);
    try {
      const data = await parentService.getParentChildren(parent.id);
      setChildren(data);
    } catch {
      showNotification("Failed to fetch linked children", "error");
    } finally {
      setLoading(false);
    }
  }, [parent, showNotification]);

  useEffect(() => {
    if (isOpen && parent) {
      fetchChildren();
    }
  }, [isOpen, parent, fetchChildren]);

  const handleUnlink = (studentId: number) => {
    setUnlinkDialog({ isOpen: true, studentId });
  };

  const confirmUnlink = async () => {
    if (!unlinkDialog.studentId) return;
    setUnlinking(unlinkDialog.studentId);
    try {
      await parentService.unlinkStudent(unlinkDialog.studentId);
      showNotification("Student unlinked successfully", "success");
      setChildren((prev) =>
        prev.filter((s) => s.id !== unlinkDialog.studentId),
      );
      onUpdate();
    } catch {
      showNotification("Failed to unlink student", "error");
    } finally {
      setUnlinking(null);
      setUnlinkDialog({ isOpen: false, studentId: null });
    }
  };

  if (!isOpen || !parent) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 text-2xl font-black">
                {parent.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {parent.fullName}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      parent.isActive
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {parent.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-slate-400">
                    Joined{" "}
                    {new Date(parent.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* Info Cards - Row 1 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Mail className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Email
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 break-all">
                  {parent.email}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Phone className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Phone
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {parent.phone || "N/A"}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Gender
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 capitalize">
                  {parent.gender || "Not specified"}
                </p>
              </div>
            </div>

            {/* Info Cards - Row 2 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Date of Birth
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {parent.dateOfBirth
                    ? new Date(parent.dateOfBirth).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <MapPin className="w-4 h-4 text-slate-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Address
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {parent.address || "N/A"}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 my-6" />

            {/* Linked Children Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <UserCheck className="w-5 h-5 text-slate-600" />
                  Linked Children
                  <span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-xs font-bold">
                    {children.length}
                  </span>
                </h4>
                <Button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Link Student
                </Button>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 text-slate-400 animate-spin mb-3" />
                    <p className="text-sm font-semibold text-slate-400">
                      Fetching children...
                    </p>
                  </div>
                ) : children.length > 0 ? (
                  children.map((child) => (
                    <div
                      key={child.id}
                      className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                            <GraduationCap className="w-6 h-6 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-lg">
                              {child.fullName}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                                {child.admissionNumber}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs font-semibold text-slate-600">
                                {child.className}{" "}
                                {child.classSection
                                  ? `- ${child.classSection}`
                                  : ""}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  child.status === "active"
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {child.status === "active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlink(child.id);
                            }}
                            disabled={unlinking === child.id}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="Unlink student"
                          >
                            {unlinking === child.id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                            ) : (
                              <Unlink2 className="w-5 h-5" />
                            )}
                          </button>
                          <div className="p-2 text-slate-300 group-hover:text-slate-500 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <GraduationCap className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-base font-semibold text-slate-600">
                      No children linked
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Link students to this parent for fee payments & results
                    </p>
                    <Button
                      onClick={() => setIsLinkModalOpen(true)}
                      className="mt-4 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-all"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Link First Child
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <LinkStudentModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        parentId={parent.id}
        parentName={parent.fullName}
        onSuccess={() => {
          fetchChildren();
          onUpdate();
        }}
      />

      <ConfirmDialog
        isOpen={unlinkDialog.isOpen}
        onClose={() => setUnlinkDialog({ isOpen: false, studentId: null })}
        onConfirm={confirmUnlink}
        title="Unlink Student"
        message="Are you sure you want to unlink this student? This action cannot be undone."
        confirmText="Unlink"
        variant="warning"
      />
    </>
  );
};

export default ParentDetailsModal;

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, Search, Shield, Lock, Eye,
  Calendar, User, ExternalLink, Download,
  Pill, Stethoscope, FlaskConical, FileImage
} from "lucide-react";

const recordTypes = [
  { key: "all", label: "All", icon: FileText },
  { key: "lab_report", label: "Lab Reports", icon: FlaskConical },
  { key: "prescription", label: "Prescriptions", icon: Pill },
  { key: "imaging", label: "Imaging", icon: FileImage },
  { key: "consultation", label: "Consultations", icon: Stethoscope },
];

const mockRecords = [
  {
    id: "1",
    title: "Complete Blood Count (CBC)",
    record_type: "lab_report",
    description: "Routine blood panel — all values in normal range. WBC, RBC, hemoglobin, and platelet counts stable.",
    provider: "Apollo Diagnostics",
    created_at: "2026-03-28T10:30:00Z",
    is_encrypted: true,
    ipfs_cid: "QmX7d...",
    tags: ["blood", "routine", "quarterly"],
  },
  {
    id: "2",
    title: "Chest X-Ray Report",
    record_type: "imaging",
    description: "PA and lateral chest radiograph. Lungs clear, no infiltrates. Heart size normal. No pleural effusion.",
    provider: "AMTZ Medical Center",
    created_at: "2026-03-20T14:15:00Z",
    is_encrypted: true,
    ipfs_cid: "QmRk2...",
    tags: ["chest", "imaging", "cleared"],
  },
  {
    id: "3",
    title: "Metformin HCl 500mg Prescription",
    record_type: "prescription",
    description: "Prescribed Metformin 500mg twice daily with meals for pre-diabetic management. 3-month supply.",
    provider: "Dr. Sharma, Endocrinology",
    created_at: "2026-03-15T09:00:00Z",
    is_encrypted: true,
    ipfs_cid: "QmFz9...",
    tags: ["diabetes", "medication", "3-month"],
  },
  {
    id: "4",
    title: "Cardiology Follow-up Notes",
    record_type: "consultation",
    description: "Annual cardiovascular assessment. ECG normal sinus rhythm. Lipid panel satisfactory. Continue current regimen.",
    provider: "Dr. Patel, Cardiologist",
    created_at: "2026-03-10T11:30:00Z",
    is_encrypted: false,
    ipfs_cid: "",
    tags: ["cardiac", "annual", "follow-up"],
  },
  {
    id: "5",
    title: "HbA1c Lab Report",
    record_type: "lab_report",
    description: "HbA1c at 5.9% — borderline pre-diabetic. Fasting glucose 108 mg/dL. Recommended dietary adjustments.",
    provider: "Apollo Diagnostics",
    created_at: "2026-03-05T08:45:00Z",
    is_encrypted: true,
    ipfs_cid: "QmW33...",
    tags: ["diabetes", "hba1c", "quarterly"],
  },
];

const typeIcons: Record<string, typeof FileText> = {
  lab_report: FlaskConical,
  prescription: Pill,
  imaging: FileImage,
  consultation: Stethoscope,
};

const typeColors: Record<string, string> = {
  lab_report: "#00f0ff",
  prescription: "#f59e0b",
  imaging: "#8b5cf6",
  consultation: "#10b981",
};

export default function RecordsView() {
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const filtered = mockRecords.filter((r) => {
    if (selectedType !== "all" && r.record_type !== selectedType) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">Medical Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mockRecords.length} records • {mockRecords.filter(r => r.is_encrypted).length} encrypted on IPFS
          </p>
        </div>
        <motion.button
          onClick={() => setShowUpload(!showUpload)}
          className="btn-primary flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload size={16} />
          Upload Record
        </motion.button>
      </div>

      {/* Upload Zone */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            className="glass-card p-6 border-2 border-dashed border-violet-500/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="text-center">
              <Upload size={32} className="mx-auto text-violet-400 mb-3" />
              <p className="text-sm text-slate-300 mb-1">Drop files here or click to browse</p>
              <p className="text-[11px] text-slate-600">Supports PDF, DICOM, JPG, PNG — up to 50MB</p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-violet-500/30 bg-white/[0.03] text-violet-500" />
                  Encrypt & store on IPFS
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" className="rounded border-violet-500/30 bg-white/[0.03] text-violet-500" />
                  Record on blockchain
                </label>
              </div>
              <button className="mt-4 btn-outline text-sm">
                Select Files
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          {recordTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.key}
                onClick={() => setSelectedType(type.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedType === type.key
                    ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                    : "text-slate-500 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <Icon size={13} />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {filtered.map((record, i) => {
          const Icon = typeIcons[record.record_type] || FileText;
          const color = typeColors[record.record_type] || "#94a3b8";
          const date = new Date(record.created_at);

          return (
            <motion.div
              key={record.id}
              className="glass-card p-4 group cursor-pointer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ x: 4 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-slate-200 truncate">
                      {record.title}
                    </h4>
                    {record.is_encrypted && (
                      <Lock size={12} className="text-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                    {record.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <User size={10} /> {record.provider}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {record.ipfs_cid && (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <Shield size={10} /> IPFS
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {record.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.03] text-slate-500 border border-white/[0.04]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 rounded-lg hover:bg-white/[0.04] transition-all">
                    <Eye size={14} className="text-slate-500" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/[0.04] transition-all">
                    <Download size={14} className="text-slate-500" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/[0.04] transition-all">
                    <ExternalLink size={14} className="text-slate-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

interface ExportDropdownProps {
  onExportExcel: () => void;
  onExportPdf: () => void;
  disabled?: boolean;
  label?: string;
}

export function ExportDropdown({
  onExportExcel,
  onExportPdf,
  disabled = false,
  label = 'Export',
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExcel = async () => {
    setExporting('excel');
    try {
      onExportExcel();
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  const handlePdf = async () => {
    setExporting('pdf');
    try {
      onExportPdf();
    } finally {
      setExporting(null);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-300/60 dark:border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            onClick={handleExcel}
            disabled={exporting !== null}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100/80 dark:bg-slate-800/80 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            {exporting === 'excel' ? 'Exporting…' : 'Export Excel'}
          </button>
          <div className="border-t border-slate-200/60 dark:border-slate-800/60" />
          <button
            onClick={handlePdf}
            disabled={exporting !== null}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-slate-100/80 dark:bg-slate-800/80 transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      )}
    </div>
  );
}

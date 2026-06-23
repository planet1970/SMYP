import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Sil',
  cancelText = 'İptal',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-24 right-6 z-[100] w-full max-w-sm pointer-events-none">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/85 rounded-2xl shadow-2xl p-5 text-slate-800 animate-slide-in-right pointer-events-auto relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>

        <div className="flex gap-4">
          <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center border border-red-100 shrink-0">
            <AlertTriangle size={20} />
          </div>

          <div className="space-y-3 flex-1">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancel}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="py-1.5 px-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


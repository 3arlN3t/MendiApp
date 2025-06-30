import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div className={`relative w-full ${sizes[size]} transform rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl transition-all border border-white/20`}>
          <div className="flex items-center justify-between border-b border-slate-200/50 p-8">
            <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-2xl p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200 hover:scale-105"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
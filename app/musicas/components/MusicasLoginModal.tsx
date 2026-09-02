"use client";

import { X } from "lucide-react";
import { PortalLogin } from "../../portal/PortalLogin";

type MusicasLoginModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export function MusicasLoginModal({ onClose, onSuccess }: MusicasLoginModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar login"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-[#121212] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>
        <PortalLogin embedded onSuccess={() => {
            onSuccess();
            onClose();
          }}
        />
      </div>
    </div>
  );
}

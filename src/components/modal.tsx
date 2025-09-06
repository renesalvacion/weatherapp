import { useEffect, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  
  return (
    <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="absolute top-3 right-3 w-8 h-8 rounded-full font-bold text-white bg-red-500 hover:bg-red-700 cursor-pointer"
        onClick={onClose}
      >
        ✕
      </button>
      <h1 className="text-xl font-bold mb-4">Modal</h1>
      {children}
    </div>


  </div>

  
  
  )
}


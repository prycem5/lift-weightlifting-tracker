"use client";

import { useEffect, useState } from "react";

type ConfirmModalProps = {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: string; // "default" or "destructive"
    onConfirm: () => void;
    onClose: () => void;
};

export const ConfirmModal = ({
    isOpen,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Go Back",
    variant = "default",
    onConfirm,
    onClose,
}: ConfirmModalProps) => {
    const [mounted, setMounted] = useState(isOpen);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            // Small frame delay to trigger enter transition
            const frame = requestAnimationFrame(() => setVisible(true));
            return () => cancelAnimationFrame(frame);
        } else {
            setVisible(false);
            const timer = setTimeout(() => setMounted(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted) {
        return null;
    }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0 transition-opacity duration-200 ease-out ${visible ? "opacity-100" : "opacity-0"
                }`}
            role="presentation"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                className={`w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl transition-all duration-200 ease-out transform ${visible
                        ? "scale-100 translate-y-0 opacity-100"
                        : "scale-95 translate-y-2 opacity-0"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <h2
                    id="confirm-modal-title"
                    className="text-base font-semibold text-zinc-100"
                >
                    {title}
                </h2>

                {description !== undefined && (
                    <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">
                        {description}
                    </p>
                )}

                <div className="mt-5 flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                        aria-label={cancelLabel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${variant === "destructive"
                                ? "bg-red-500 text-white hover:bg-red-400"
                                : "bg-green-400 text-zinc-950 hover:bg-green-300"
                            }`}
                        aria-label={confirmLabel}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
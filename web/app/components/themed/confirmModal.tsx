"use client";

type ConfirmModalProps = {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: string; //"default" or "destructive"
    onConfirm: () => void;
    onClose: () => void;
}

export const ConfirmModal = ({ isOpen, title, description, confirmLabel = "Confirm", cancelLabel = "Go Back", variant = "default", onConfirm, onClose }: ConfirmModalProps) => {

    if (isOpen == false) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0" role="presentation" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h2 id="confirm-modal-title" className="text-base font-semibold text-zinc-100">{title}</h2>

                {description !== undefined && (
                    <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{description}</p>
                )}

                <div className="mt-5 flex gap-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 press:underline hover:bg-zinc-700" aria-label={cancelLabel}>{cancelLabel}</button>
                    <button type="button" onClick={onConfirm} className={variant == "destructive" ? "flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-400" : "flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-400 text-zinc-950 hover:bg-green-300"} aria-label={confirmLabel}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    )

}

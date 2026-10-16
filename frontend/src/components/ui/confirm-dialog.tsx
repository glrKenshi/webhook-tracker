"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirming = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={confirming} onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={confirming}
          onClick={onConfirm}
        >
          {confirming ? "Deleting…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

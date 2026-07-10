import Modal, { PixelButton } from "./Modal.jsx";

// Pixel-styled replacement for window.confirm — feels native to the game
// and works nicely on mobile (no browser chrome popups).
export default function ConfirmDialog({ title = "ARE YOU SURE?", message, confirmLabel = "YES, DO IT", onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="font-lcd text-xl text-bone/80 mb-4">{message}</p>
      <div className="grid grid-cols-2 gap-3">
        <PixelButton variant="ghost" onClick={onCancel}>
          CANCEL
        </PixelButton>
        <PixelButton variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </PixelButton>
      </div>
    </Modal>
  );
}

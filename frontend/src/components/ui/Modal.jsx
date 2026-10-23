import './Modal.css';
import Button from './Button';

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="modal__title">{title}</h3>}
        {children}
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
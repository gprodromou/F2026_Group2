import './Button.css';

export default function Button({ children, variant = 'primary', type = 'button', disabled = false, onClick }) {
  return (
    <button type={type} className={`btn btn--${variant}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
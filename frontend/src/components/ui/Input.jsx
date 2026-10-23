import './Input.css';

export default function Input({ label, id, error, disabled = false, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">{label}</label>
      <input
        id={id}
        className={`field__input${error ? ' field__input--error' : ''}`}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      <p className="field__error">{error}</p>
    </div>
  );
}
import './Input.css';
import FormError from './FormError';

export default function Input({ label, id, error, disabled = false, ...props }) {
  const errorId = id ? `${id}-error` : undefined;

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">{label}</label>
      <input
        id={id}
        className={`field__input${error ? ' field__input--error' : ''}`}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      <div className="field__error">
        <FormError message={error} id={errorId} />
      </div>
    </div>
  );
}
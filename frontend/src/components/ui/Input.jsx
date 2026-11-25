import './Input.css';
import FormError from './FormError';

// required: marks the field as mandatory. A red * appears after the label (drawn by CSS, so the
// label's text stays exactly the same) and the <input> gets `required`, which screen readers
// announce. Forms use noValidate, so the browser does not show its own pop-ups.
// hideLabel: the label is still there for screen readers (and tests), just not shown.
// hint: a short rule shown under the box (e.g. "At least 8 characters"). hintMet turns it
// into a petrol tick once the rule is met. While an error is shown, the hint steps aside.
export default function Input({
  label, id, error, disabled = false, required = false, hideLabel = false,
  hint, hintMet = false, ...props
}) {
  const errorId = id ? `${id}-error` : undefined;
  const hintId = id && hint ? `${id}-hint` : undefined;
  const showHint = Boolean(hint) && !error;
  const describedBy = [showHint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field${required ? ' field--required' : ''}`}>
      <label htmlFor={id} className={`field__label${hideLabel ? ' field__label--hidden' : ''}`}>{label}</label>
      <input
        id={id}
        className={`field__input${error ? ' field__input--error' : ''}`}
        disabled={disabled}
        required={required || undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {showHint && (
        <p id={hintId} className={`field__hint${hintMet ? ' field__hint--met' : ''}`}>
          <span className="field__hint-mark" aria-hidden="true">{hintMet ? '✓' : '•'}</span>
          <span>{hint}</span>
        </p>
      )}
      <div className="field__error">
        <FormError message={error} id={errorId} />
      </div>
    </div>
  );
}
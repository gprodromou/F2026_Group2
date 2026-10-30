import './FormError.css';

// Shows the error message from lib/validate.js; renders nothing if empty.
// role="alert" lets screen readers announce it (NFR05).
export default function FormError({ message, id }) {
  if (!message) return null;
  return (
    <p className="form-error" id={id} role="alert">
      {message}
    </p>
  );
}
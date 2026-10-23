import './Card.css';

export default function Card({ title, variant = 'feature', children }) {
  return (
    <div className={`card card--${variant}`}>
      {title && <h3 className="card__title">{title}</h3>}
      {children}
    </div>
  );
}
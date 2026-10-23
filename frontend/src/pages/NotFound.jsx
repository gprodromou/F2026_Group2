import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="not-found">
      <h1>Page not found</h1>
      <p>Wrong url check the address and try again.</p>
      <Link to="/">Back to home</Link>
    </section>
  );
}
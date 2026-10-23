import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <section className="landing">
      <h1>fit4you</h1>
      <p>
        Create an account to be able to log your workouts,set goals and see your progress.
      </p>
      <div className="landing-actions">
        <Link to="/register" className="landing-cta">
          Create an account 
        </Link>
        <Link to="/login" className="landing-login">
              Log in
        </Link>
      </div>
    </section>
  );
}
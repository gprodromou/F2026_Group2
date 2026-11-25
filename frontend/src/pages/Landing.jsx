// Landing.jsx: the home page (/), rebuilt to match Yanna's landing design (week 7).
//   left:  three green feature cards; the big bottom one is a carousel with five dots
//   right: the pink login card (the real login form), or a welcome card when signed in
//   below: "Chat with us!" bubble, then the About, Services and Contact sections that
//          the header links scroll to (/#about, /#services, /#contact)
// Andreas built the first version in week 1.

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../state/AuthContext';
import './Auth.css';
import './Landing.css';

// ---------- icons (plain SVG, coloured by CSS through currentColor) ----------
function ProfileIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <circle cx="32" cy="32" r="29" />
      <path d="M32 14c-6 0-10 4.5-10 11 0 4 1.5 7.5 4 9.5-6 2-10 6-11 12.5M32 14c6 0 10 4.5 10 11 0 4-1.5 7.5-4 9.5 6 2 10 6 11 12.5" strokeLinecap="round" />
    </svg>
  );
}

function GoalIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="32" cy="10" r="7" fill="currentColor" stroke="none" />
      <path d="M16 12l10 12h12l10-12" strokeWidth="6" />
      <path d="M32 26v12" strokeWidth="13" />
      <path d="M27 40v18M37 40v18" strokeWidth="6" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 26c0-8 7.5-14 17-14s17 6 17 14-7.5 14-17 14c-2 0-4-.3-5.8-.8L10 44l2.6-8.2C9.7 33.3 8 29.8 8 26z" />
      <path d="M45 24.5c6.4 1.8 11 6.6 11 12.3 0 3.4-1.6 6.5-4.3 8.8L54 53l-8.8-4.2c-1.6.4-3.4.6-5.2.6-6.6 0-12.2-3.2-14.6-7.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 8v48h48" />
      <path d="M16 44l11-13 9 7 16-20" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="12" y="6" width="40" height="52" rx="5" />
      <path d="M21 20h22M21 30h22M21 40h14" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
      <path d="M24 16h30M24 32h30M24 48h30" />
      <circle cx="12" cy="16" r="2.5" fill="currentColor" />
      <circle cx="12" cy="32" r="2.5" fill="currentColor" />
      <circle cx="12" cy="48" r="2.5" fill="currentColor" />
    </svg>
  );
}

// ---------- the carousel in the big card: one slide per dot ----------
const SLIDES = [
  { icon: <ChatIcon />, title: 'Chat with a personal trainer at any time.', text: 'Ask about specific exercises, diet, anything!' },
  { icon: <NoteIcon />, title: 'Log every workout in seconds.', text: 'Type, duration, distance and how it felt, all in one place.' },
  { icon: <ChartIcon />, title: 'Watch your progress grow.', text: 'Goals fill up as you train, so you always know how close you are.' },
  { icon: <ListIcon />, title: 'Look back at your history.', text: 'Filter past workouts by date and type to see what works for you.' },
  { icon: <GoalIcon />, title: 'Start from a ready-made plan.', text: 'Workout templates help you get going on day one.' },
];
const SLIDE_SECONDS = 6;

function FeatureCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  // Move to the next slide every few seconds, unless the mouse or keyboard is on the card.
  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => {
      setCurrent((index) => (index + 1) % SLIDES.length);
    }, SLIDE_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div
      className="landing-card landing-card--wide"
      role="region"
      aria-roledescription="carousel"
      aria-label="What fit4you can do"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* All slides are on the page, stacked; CSS fades the current one in and the rest out.
          aria-hidden keeps screen readers on the visible slide only. */}
      <div className="landing-slides" aria-live="polite">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.title}
            className={`landing-slide${index === current ? ' landing-slide--active' : ''}`}
            aria-hidden={index === current ? undefined : 'true'}
          >
            <span className="landing-card__icon">{slide.icon}</span>
            <div className="landing-slide__text">
              <p className="landing-card__text">{slide.title}</p>
              <p className="landing-card__text">{slide.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="landing-dots">
        {SLIDES.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={`landing-dot${index === current ? ' landing-dot--active' : ''}`}
            aria-label={`Show slide ${index + 1} of ${SLIDES.length}`}
            aria-current={index === current ? 'true' : undefined}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- right column: login card, or a welcome card when already signed in ----------
function LoginCard() {
  return (
    <section className="auth-card landing-login" aria-labelledby="landing-login-title">
      <h2 id="landing-login-title" className="auth-title landing-login__title">Login</h2>
      <LoginForm />
      <p className="auth-footer">
        Don&apos;t have an account with us?{' '}
        <Link className="auth-link" to="/register">
          Register Here
        </Link>
      </p>
    </section>
  );
}

function WelcomeCard() {
  return (
    <section className="auth-card landing-login" aria-labelledby="landing-welcome-title">
      <h2 id="landing-welcome-title" className="auth-title">Welcome back!</h2>
      <p className="auth-text">Pick up where you left off.</p>
      <div className="landing-welcome__actions">
        <Link to="/workouts/new" className="nav-button nav-button--primary">Log a workout</Link>
        <Link to="/workouts" className="nav-button nav-button--secondary">See your history</Link>
        <Link to="/goals" className="nav-button nav-button--secondary">Check your goals</Link>
      </div>
    </section>
  );
}

export default function Landing() {
  const { isSignedIn } = useAuth();
  const { hash } = useLocation();

  // The header links About / Services / Contact us go to /#about etc.
  // React Router changes the address but does not scroll, so scroll here.
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <div className="landing">
      {/* The logo in the header is the visible name; this heading is for screen readers. */}
      <h1 className="visually-hidden">fit4you</h1>

      <div className="landing-hero">
        <div className="landing-features">
          <div className="landing-card">
            <span className="landing-card__icon"><ProfileIcon /></span>
            <p className="landing-card__text">Build your profile based on your fitness goals</p>
          </div>
          <div className="landing-card">
            <span className="landing-card__icon"><GoalIcon /></span>
            <p className="landing-card__text">Reach your goals</p>
          </div>
          <FeatureCarousel />
        </div>

        <div className="landing-side">
          {isSignedIn ? <WelcomeCard /> : <LoginCard />}
        </div>
      </div>

      <section id="about" className="landing-section">
        <h2 className="landing-section__title">About</h2>
        <p>
          fit4you is an online fitness tracker. Create an account to log your workouts,
          set goals and see your progress, all in one place. Your data stays private to you,
          and two-factor login keeps your account safe.
        </p>
        {!isSignedIn && (
          <div className="landing-section__actions">
            <Link to="/register" className="nav-button nav-button--primary">Create an account</Link>
            <Link to="/login" className="nav-button nav-button--secondary">Log in</Link>
          </div>
        )}
      </section>

      <section id="services" className="landing-section">
        <h2 className="landing-section__title">Services</h2>
        <div className="landing-services">
          <article id="service-workouts" className="landing-service">
            <span className="landing-service__icon"><NoteIcon /></span>
            <h3>Workout log</h3>
            <p>Record each workout with its type, duration and distance.</p>
          </article>
          <article id="service-goals" className="landing-service">
            <span className="landing-service__icon"><ChartIcon /></span>
            <h3>Goals and progress</h3>
            <p>Set a target and watch the progress bar fill as you train.</p>
          </article>
          <article id="service-history" className="landing-service">
            <span className="landing-service__icon"><ListIcon /></span>
            <h3>Workout history</h3>
            <p>Filter past workouts by date and type to spot your patterns.</p>
          </article>
        </div>
      </section>

      <section id="contact" className="landing-section">
        <h2 className="landing-section__title">Contact us</h2>
        <p>
          Questions, ideas or problems with your account? Email us at{' '}
          <a className="auth-link" href="mailto:contact@fit4you.com">contact@fit4you.com</a>{' '}
          and we will get back to you.
        </p>
      </section>
    </div>
  );
}

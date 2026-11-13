// SiteFooter.jsx: the footer shared by all layouts. Same as the designs:
// logo on the left, copyright in the middle, social icons on the right.
// tone="light" is the paler green used on the signed-in app screens.
// The icon links go to the networks' home pages until the real accounts exist.

import './SiteFooter.css';

const SOCIAL = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/',
    path: <path d="M14 8h2V5h-2.5C10.9 5 10 6.6 10 8.5V10H8v3h2v7h3v-7h2.2l.4-3H13V8.7c0-.5.2-.7 1-.7z" />,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/',
    path: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.8" />
        <circle cx="17" cy="7" r="0.6" />
      </>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/',
    path: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
        <path d="M8 11v6M8 7.6v.1M12 17v-6M12 13.5c0-1.7 1-2.6 2.4-2.6s2.1 1 2.1 2.6V17" />
      </>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/',
    path: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10 9.2v5.6l4.8-2.8z" />
      </>
    ),
  },
];

export default function SiteFooter({ tone = 'default' }) {
  return (
    <footer className={`site-footer${tone === 'light' ? ' site-footer--light' : ''}`}>
      <span className="site-footer__logo">fit4you</span>
      <p className="site-footer__text">Copyright © 2026 fit4you. All rights reserved.</p>
      <ul className="site-footer__social" aria-label="Social media">
        {SOCIAL.map((item) => (
          <li key={item.label}>
            <a
              className="site-footer__icon"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {item.path}
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}

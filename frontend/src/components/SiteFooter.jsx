// SiteFooter.jsx: the footer shared by both layouts (logo + copyright).

import './SiteFooter.css';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="site-footer__logo">fit4you</span>
      <p className="site-footer__text">Copyright © 2026 fit4you. All rights reserved.</p>
    </footer>
  );
}

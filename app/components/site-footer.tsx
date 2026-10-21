import { Link } from "react-router";

import { CONTACT_EMAIL } from "~/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer-inner">
        <div className="footer-mark">
          <span className="wordmark">Kare</span>
          <p>A sand garden for overthinking.</p>
        </div>
        <nav aria-label="Footer">
          <Link to="/support">Support</Link>
          <Link to="/privacy">Privacy policy</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>Write to us</a>
        </nav>
        <p className="footer-note">
          Kare isn't therapy. If something feels too heavy to carry,{" "}
          <a href="https://findahelpline.com">findahelpline.com</a> lists free, confidential helplines near you.
        </p>
        <p className="caption footer-legal">© 2026 Kare · No cookies, no analytics, no tracking on this site</p>
      </div>
    </footer>
  );
}

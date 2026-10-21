import { Link, NavLink } from "react-router";

import { APP_STORE_URL } from "~/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="wordmark" aria-label="Kare, home">
          Kare
        </Link>
        <nav aria-label="Site">
          <NavLink to="/support">Support</NavLink>
          <NavLink to="/privacy">Privacy</NavLink>
          <a className="header-get" href={APP_STORE_URL}>
            Get Kare
          </a>
        </nav>
      </div>
    </header>
  );
}

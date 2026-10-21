import { Link } from "react-router";

import type { Route } from "./+types/not-found";
import { SiteFooter } from "~/components/site-footer";
import { SiteHeader } from "~/components/site-header";
import "~/styles/legal.css";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Not here · Kare" }, { name: "robots", content: "noindex" }];
}

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="legal missing">
        <div className="legal-sand" aria-hidden="true" />
        <div className="wrap missing-inner">
          <p className="caption">Nothing here</p>
          <h1>This page has passed.</h1>
          <p className="legal-lede">
            <Link to="/">Back to the sand</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

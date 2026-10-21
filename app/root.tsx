import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { MotionConfig } from "motion/react";

import "@fontsource/shippori-mincho/latin-400.css";
import "@fontsource/shippori-mincho/latin-500.css";
import "@fontsource/shippori-mincho/latin-ext-400.css";
import "@fontsource/shippori-mincho/latin-ext-500.css";
import "@fontsource/zen-kaku-gothic-new/latin-400.css";
import "@fontsource/zen-kaku-gothic-new/latin-ext-400.css";
import "@fontsource/kalam/latin-300.css";
import "@fontsource/dm-mono/latin-400.css";
import "./styles/base.css";
import "./styles/chrome.css";

import type { Route } from "./+types/root";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.png", type: "image/png" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#e7dfd4" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#2a231d" media="(prefers-color-scheme: dark)" />
        <meta name="apple-itunes-app" content="app-id=6822525559" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Outlet />
    </MotionConfig>
  );
}

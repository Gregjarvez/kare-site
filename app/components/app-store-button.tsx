import { APP_STORE_URL } from "~/site";

export function AppStoreButton({ className = "" }: { className?: string }) {
  return (
    <a className={`pill store-button ${className}`} href={APP_STORE_URL}>
      <span>Download on the App Store</span>
    </a>
  );
}

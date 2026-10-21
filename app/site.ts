export const APP_STORE_URL = "https://apps.apple.com/app/id6822525559";
export const CONTACT_EMAIL = "gregjarvez@gmail.com";
export const SITE_URL = "https://kare.fyi";

export function pageMeta(title: string, description: string, path: string) {
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `${SITE_URL}${path}` },
    { property: "og:image", content: `${SITE_URL}/media/og.jpg` },
    { name: "twitter:card", content: "summary_large_image" },
    { tagName: "link", rel: "canonical", href: `${SITE_URL}${path}` },
  ];
}

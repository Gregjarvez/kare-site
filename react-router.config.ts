import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  prerender: ["/", "/privacy", "/support", "/404"],
} satisfies Config;

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arogya Care - Intelligent Triage",
    short_name: "Arogya",
    description:
      "AI-powered patient triage system for faster, smarter clinical decision support and care delivery.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#064e3b",
    background_color: "#09090b",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Arogya Care Home Screen",
      },
      {
        src: "/screenshots/triage.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "Triage Assessment View",
      },
    ],
    categories: ["health", "medical", "lifestyle"],
  };
}

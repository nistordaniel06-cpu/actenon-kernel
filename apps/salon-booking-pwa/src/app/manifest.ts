import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NearCut — programări la frizerie",
    short_name: "NearCut",
    description:
      "Găsește frizerii și saloane din apropiere, vezi cine e liber acum și rezervă în trei pași.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#090b09",
    theme_color: "#090b09",
    categories: ["lifestyle", "business"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

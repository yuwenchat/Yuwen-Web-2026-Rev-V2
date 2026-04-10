import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "语闻",
    short_name: "语闻",
    description: "为安全而克制的聊天体验而设计。",
    start_url: "/",
    display: "standalone",
    background_color: "#eef6fb",
    theme_color: "#2d5f92",
    icons: [
      {
        src: "/yuwen-logo.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/yuwen-logo.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}

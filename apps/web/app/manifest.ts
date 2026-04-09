import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "语闻",
    short_name: "语闻",
    description: "为安全而克制的聊天体验而设计。",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f1e8",
    theme_color: "#18332d",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}


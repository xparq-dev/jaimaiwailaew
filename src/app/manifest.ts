import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "จ่ายไม่ไหวแล้ว",
    short_name: "จ่ายไม่ไหวแล้ว",
    description:
      "เครื่องมือช่วยเตรียมข้อมูลและประมาณการภาษีที่ออกแบบให้ประมวลผลข้อมูลในอุปกรณ์",
    lang: "th",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0B1F3A",
    categories: ["finance", "productivity", "education"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "เริ่มต้น",
        short_name: "เริ่มต้น",
        url: "/start",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "เรียนรู้ภาษี",
        short_name: "เรียนรู้",
        url: "/learn",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}

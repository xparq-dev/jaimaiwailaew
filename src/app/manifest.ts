import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "จ่ายไม่ไหวแล้ว — Jai Mai Wai Laew",
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
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "เริ่มต้น",
        short_name: "เริ่มต้น",
        url: "/start",
        icons: [
          { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      {
        name: "เรียนรู้ภาษี",
        short_name: "เรียนรู้",
        url: "/learn",
        icons: [
          { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
    ],
  };
}

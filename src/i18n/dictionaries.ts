import type { Locale } from "@/i18n/config";

export interface Dictionary {
  brand: {
    name: string;
    subtitle: string;
  };
  common: {
    foundation: string;
    online: string;
    offline: string;
    skipToContent: string;
    switchLanguage: string;
    theme: string;
  };
  navigation: {
    home: string;
    start: string;
    calculator: string;
    learn: string;
    privacy: string;
  };
  footer: {
    localProcessing: string;
    privacy: string;
    terms: string;
    disclaimer: string;
    accessibility: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  th: {
    brand: {
      name: "จ่ายไม่ไหวแล้ว",
      subtitle: "ผู้ช่วยเตรียมข้อมูลภาษี",
    },
    common: {
      foundation: "พื้นที่จัดการข้อมูลภาษี",
      online: "ออนไลน์",
      offline: "ออฟไลน์",
      skipToContent: "ข้ามไปยังเนื้อหาหลัก",
      switchLanguage: "เปลี่ยนภาษา",
      theme: "เปลี่ยนธีม",
    },
    navigation: {
      home: "ภาพรวม",
      start: "เริ่มต้น",
      calculator: "คำนวณ",
      learn: "เรียนรู้",
      privacy: "ข้อมูลส่วนตัว",
    },
    footer: {
      localProcessing: "ออกแบบให้ข้อมูลการเงินประมวลผลในอุปกรณ์",
      privacy: "ความเป็นส่วนตัว",
      terms: "ข้อกำหนดการใช้",
      disclaimer: "ข้อจำกัดความรับผิด",
      accessibility: "การเข้าถึง",
    },
  },
  en: {
    brand: {
      name: "Jai Mai Wai Laew",
      subtitle: "Tax preparation companion",
    },
    common: {
      foundation: "Private tax workspace",
      online: "Online",
      offline: "Offline",
      skipToContent: "Skip to main content",
      switchLanguage: "Change language",
      theme: "Change theme",
    },
    navigation: {
      home: "Overview",
      start: "Get started",
      calculator: "Calculator",
      learn: "Learn",
      privacy: "Privacy",
    },
    footer: {
      localProcessing: "Designed to process financial data on your device",
      privacy: "Privacy",
      terms: "Terms",
      disclaimer: "Disclaimer",
      accessibility: "Accessibility",
    },
  },
};

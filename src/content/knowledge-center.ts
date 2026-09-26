export type KnowledgeCategory =
  "พื้นฐาน" | "แบบภาษี" | "เตรียมข้อมูล" | "การใช้งานเว็บ";

export interface KnowledgeSource {
  readonly title: string;
  readonly authority: string;
  readonly url: string;
}

export interface KnowledgeSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly checklist?: readonly string[];
}

export interface KnowledgeArticle {
  readonly slug: string;
  readonly category: KnowledgeCategory;
  readonly title: string;
  readonly summary: string;
  readonly keywords: readonly string[];
  readonly readingMinutes: number;
  readonly version: string;
  readonly lastReviewedAt: string;
  readonly sections: readonly KnowledgeSection[];
  readonly sources: readonly KnowledgeSource[];
  readonly relatedSlugs: readonly string[];
}

const revenueCodeSource: KnowledgeSource = {
  title: "ประมวลรัษฎากร มาตรา 38–64",
  authority: "กรมสรรพากร",
  url: "https://www.rd.go.th/5937.html",
};

const taxRateSource: KnowledgeSource = {
  title: "บัญชีอัตราภาษีเงินได้",
  authority: "กรมสรรพากร",
  url: "https://www.rd.go.th/5938.html",
};

const formsSource: KnowledgeSource = {
  title: "แบบแสดงรายการภาษีเงินได้บุคคลธรรมดา",
  authority: "กรมสรรพากร",
  url: "https://www.rd.go.th/272.html",
};

const expenseSource: KnowledgeSource = {
  title: "พระราชกฤษฎีกาเกี่ยวกับการหักค่าใช้จ่าย",
  authority: "กรมสรรพากร",
  url: "https://www.rd.go.th/2372.html",
};

const reviewedAt = "2026-09-26";

export const knowledgeArticles: readonly KnowledgeArticle[] = [
  {
    slug: "tax-basics",
    category: "พื้นฐาน",
    title: "พื้นฐานภาษีเงินได้บุคคลธรรมดา",
    summary:
      "รู้จักคำสำคัญและลำดับการเตรียมข้อมูล ก่อนตรวจรายละเอียดกับแบบและคำแนะนำของปีภาษีที่เกี่ยวข้อง",
    keywords: ["ภาษี", "เงินได้", "ปีภาษี", "รายได้สุทธิ", "เริ่มต้น"],
    readingMinutes: 4,
    version: "1.0.0",
    lastReviewedAt: reviewedAt,
    sections: [
      {
        heading: "เริ่มจากข้อเท็จจริงของรายได้",
        paragraphs: [
          "ภาษีเงินได้บุคคลธรรมดาเริ่มจากการรวบรวมเงินได้ที่ได้รับจริงในปีภาษี แล้วตรวจประเภทเงินได้ ค่าใช้จ่าย และค่าลดหย่อนตามเงื่อนไขที่ใช้กับปีนั้น",
          "หมวดหมู่ในเว็บมีไว้ช่วยจัดระเบียบข้อมูล ไม่ได้แทนการจัดประเภทตามกฎหมายโดยอัตโนมัติ",
        ],
      },
      {
        heading: "สิ่งที่ควรเตรียม",
        paragraphs: [
          "รวบรวมเอกสารจากทุกแหล่งก่อนเปรียบเทียบกับข้อมูลที่บันทึกไว้ และเก็บหลักฐานต้นฉบับแยกจากรายงานที่เว็บสร้าง",
        ],
        checklist: [
          "รายการรายได้จากทุกแหล่ง",
          "หนังสือรับรองภาษีหัก ณ ที่จ่าย",
          "หลักฐานรายจ่ายและค่าลดหย่อนที่เกี่ยวข้อง",
          "แบบและคำแนะนำล่าสุดจากกรมสรรพากร",
        ],
      },
    ],
    sources: [revenueCodeSource, taxRateSource],
    relatedSlugs: ["income-types", "withholding-tax", "allowances"],
  },
  {
    slug: "pnd94",
    category: "แบบภาษี",
    title: "เตรียมข้อมูลสำหรับ ภ.ง.ด.94",
    summary:
      "แยกข้อมูลช่วงครึ่งปีและตรวจว่าแบบนี้เกี่ยวข้องกับประเภทเงินได้ของคุณหรือไม่ ก่อนยื่นจริง",
    keywords: ["ภงด94", "ภ.ง.ด.94", "ครึ่งปี", "ยื่นแบบ"],
    readingMinutes: 3,
    version: "1.0.0",
    lastReviewedAt: reviewedAt,
    sections: [
      {
        heading: "แยกการเตรียมข้อมูลออกจากการยื่นแบบ",
        paragraphs: [
          "หน้าเครื่องคำนวณช่วยรวมข้อมูลในช่วงเวลาที่เลือก แต่ไม่ได้ยืนยันว่าผู้ใช้มีหน้าที่ยื่น ภ.ง.ด.94 หรือกรอกแบบถูกต้องครบถ้วน",
          "ควรตรวจประเภทเงินได้ ช่วงเวลารับเงินจริง และคำแนะนำของแบบปีล่าสุดจากกรมสรรพากรก่อนยื่น",
        ],
      },
      {
        heading: "รายการตรวจสอบก่อนดำเนินการ",
        paragraphs: [
          "ยอดรวมควรย้อนกลับไปตรวจได้จากเอกสารหรือรายการรับเงินจริง",
        ],
        checklist: [
          "เลือกปีภาษีและช่วงเวลาให้ถูกต้อง",
          "แยกรายได้ตามแหล่งและประเภท",
          "ตรวจภาษีที่ถูกหักไว้กับเอกสาร",
          "อ่านคำแนะนำของแบบฉบับล่าสุด",
        ],
      },
    ],
    sources: [formsSource, revenueCodeSource],
    relatedSlugs: ["income-types", "expenses", "tax-calendar"],
  },
  {
    slug: "pnd91",
    category: "แบบภาษี",
    title: "เตรียมข้อมูลเงินเดือนสำหรับ ภ.ง.ด.91",
    summary:
      "รวบรวมเงินเดือน โบนัส และภาษีที่ถูกหักจากเอกสารของผู้จ่าย ก่อนเทียบกับแบบประจำปี",
    keywords: ["ภงด91", "ภ.ง.ด.91", "เงินเดือน", "โบนัส", "ประจำปี"],
    readingMinutes: 3,
    version: "1.0.0",
    lastReviewedAt: reviewedAt,
    sections: [
      {
        heading: "ใช้ยอดก่อนหักเป็นจุดเริ่มต้น",
        paragraphs: [
          "การบันทึกเงินเดือนควรอิงยอดรายได้ก่อนหักรายการต่าง ๆ แล้วบันทึกภาษีหัก ณ ที่จ่ายและสิทธิที่เกี่ยวข้องแยกจากกัน",
          "หากมีรายได้มากกว่ารูปแบบเงินเดือน ควรตรวจว่าแบบ ภ.ง.ด.91 ยังตรงกับข้อเท็จจริงของคุณหรือควรใช้แบบอื่น",
        ],
      },
      {
        heading: "เอกสารที่ควรเทียบยอด",
        paragraphs: [
          "ตรวจยอดรวมทั้งปีกับเอกสารจากนายจ้างทุกแห่งก่อนนำผลประมาณการไปใช้",
        ],
        checklist: [
          "หนังสือรับรองภาษีหัก ณ ที่จ่าย",
          "สรุปเงินเดือนและโบนัสทั้งปี",
          "รายการประกันสังคมหรือสิทธิที่มีหลักฐาน",
          "คำแนะนำของแบบปีภาษีล่าสุด",
        ],
      },
    ],
    sources: [formsSource, revenueCodeSource],
    relatedSlugs: ["withholding-tax", "allowances", "tax-calendar"],
  },
  {
    slug: "income-types",
    category: "เตรียมข้อมูล",
    title: "แยกประเภทรายได้อย่างระมัดระวัง",
    summary:
      "ใช้หมวดในเว็บเพื่อค้นและรวมรายการ แล้วตรวจประเภทเงินได้ตามมาตรา 40 กับข้อเท็จจริงอีกครั้ง",
    keywords: ["ประเภทรายได้", "มาตรา 40", "เงินเดือน", "ฟรีแลนซ์", "ขายของ"],
    readingMinutes: 4,
    version: "1.0.0",
    lastReviewedAt: reviewedAt,
    sections: [
      {
        heading: "ชื่ออาชีพอาจไม่บอกประเภทเงินได้ทั้งหมด",
        paragraphs: [
          "งานที่เรียกชื่อคล้ายกันอาจมีเงื่อนไข สัญญา และภาระค่าใช้จ่ายต่างกัน จึงไม่ควรตัดสินประเภทเงินได้จากชื่อหมวดเพียงอย่างเดียว",
          "แหล่งรายได้ในเว็บเป็นข้อความช่วยจำ ผู้ใช้แก้ไขหรือเว้นว่างได้ และไม่มีผลเป็นคำวินิจฉัยทางภาษี",
        ],
      },
      {
        heading: "คำถามที่ช่วยแยกรายการ",
        paragraphs: [
          "ถ้ารายการยังคลุมเครือ ให้เก็บเอกสารและตั้งสถานะรอตรวจแทนการเดา",
        ],
        checklist: [
          "เงินมาจากใครและแลกกับงานหรือทรัพย์สินอะไร",
          "มีสัญญา ใบเสร็จ หรือหนังสือรับรองหรือไม่",
          "ผู้รับเงินต้องลงทุนหรือรับภาระค่าใช้จ่ายแบบใด",
          "มีหลายกิจกรรมที่ควรแยกบันทึกหรือไม่",
        ],
      },
    ],
    sources: [revenueCodeSource],
    relatedSlugs: ["tax-basics", "expenses", "pnd94"],
  },
  {
    slug: "expenses",
    category: "เตรียมข้อมูล",
    title: "ทบทวนรายจ่ายโดยไม่เหมารวม",
    summary:
      "แยกรายจ่ายที่บันทึกเพื่อจัดการเงินออกจากค่าใช้จ่ายทางภาษี ซึ่งต้องตรวจเงื่อนไขและหลักฐานต่างหาก",
    keywords: ["รายจ่าย", "ค่าใช้จ่าย", "หลักฐาน", "ใบเสร็จ", "หักค่าใช้จ่าย"],
    readingMinutes: 4,
    version: "1.0.0",
    lastReviewedAt: reviewedAt,
    sections: [
      {
        heading: "รายจ่ายในชีวิตจริงไม่เท่ากับค่าใช้จ่ายทางภาษีเสมอไป",
        paragraphs: [
          "เว็บอนุญาตให้บันทึกรายจ่ายเพื่อเห็นภาพกระแสเงิน แต่ไม่รับรองว่ารายการนั้นนำไปหักภาษีได้",
          "วิธีหักค่าใช้จ่ายขึ้นอยู่กับประเภทเงินได้และเงื่อนไขของกฎหมายที่ใช้ในปีภาษีนั้น",
        ],
      },
      {
        heading: "เก็บข้อมูลให้ตรวจย้อนหลังได้",
        paragraphs: [
          "เมื่อไม่แน่ใจ ให้แยกรายการส่วนตัวและรายการรอตรวจออกจากรายการที่มีหลักฐานครบ",
        ],
        checklist: [
          "วันที่และผู้รับเงิน",
          "วัตถุประสงค์ของรายจ่าย",
          "ใบเสร็จหรือหลักฐานการชำระ",
          "ความเกี่ยวข้องกับแหล่งรายได้",
        ],
      },
    ],
    sources: [expenseSource, revenueCodeSource],
    relatedSlugs: ["income-types", "allowances", "pnd94"],
  },
  {
    slug: "allowances",
    category: "เตรียมข้อมูล",
    title: "เตรียมข้อมูลค่าลดหย่อนตามปีภาษี",
    summary:
      "รวบรวมสิทธิและหลักฐานแยกตามประเภท โดยตรวจเงื่อนไขของปีภาษีก่อนนำยอดไปใช้",
    keywords: ["ค่าลดหย่อน", "สิทธิ", "ประกัน", "กองทุน", "ประกันสังคม"],
    readingMinutes: 3,
    version: "1.0.0",
    lastReviewedAt: reviewedAt,
    sections: [
      {
        heading: "สิทธิอาจเปลี่ยนตามปีและเงื่อนไขส่วนบุคคล",
        paragraphs: [
          "อย่านำวงเงินจากปีอื่นหรือจากตัวอย่างของบุคคลอื่นมาใช้โดยไม่ตรวจสอบ เงื่อนไขอาจเกี่ยวกับอายุ ความสัมพันธ์ ระยะเวลาถือครอง หรือหลักฐานเฉพาะ",
          "ตัวเลขที่บันทึกในเว็บควรเป็นยอดที่มีหลักฐานและอยู่ในขอบเขตสิทธิของผู้ใช้จริง",
        ],
      },
      {
        heading: "วิธีจัดเอกสาร",
        paragraphs: [
          "แยกเอกสารตามประเภทและปีภาษี เพื่อป้องกันการนับซ้ำหรือใช้ผิดปี",
        ],
        checklist: [
          "ชื่อผู้มีสิทธิและปีภาษี",
          "ยอดที่ชำระจริง",
          "เอกสารจากหน่วยงานหรือผู้ให้บริการ",
          "เงื่อนไขและเพดานล่าสุดจากแหล่งทางการ",
        ],
      },
    ],
    sources: [formsSource, revenueCodeSource],
    relatedSlugs: ["pnd91", "tax-basics", "expenses"],
  },
  {
    slug: "withholding-tax",
    category: "เตรียมข้อมูล",
    title: "ตรวจภาษีหัก ณ ที่จ่ายจากเอกสาร",
    summary:
      "บันทึกยอดที่ผู้จ่ายหักไว้แยกจากรายได้ และเทียบกับหนังสือรับรองก่อนสรุปทั้งปี",
    keywords: ["ภาษีหัก ณ ที่จ่าย", "หนังสือรับรอง", "50 ทวิ", "ผู้จ่าย"],
    readingMinutes: 3,
    version: "1.0.0",
    lastReviewedAt: reviewedAt,
    sections: [
      {
        heading: "ภาษีที่ถูกหักไม่ใช่ยอดรายได้สุทธิ",
        paragraphs: [
          "ควรบันทึกรายได้และภาษีที่ถูกหักเป็นคนละข้อมูล เพื่อให้ตรวจยอดรวมและเอกสารได้ชัดเจน",
          "ยอดที่ถูกหักไว้ไม่ใช่คำตอบสุดท้ายว่าต้องชำระเพิ่มหรือขอคืนได้เท่าใด เพราะยังขึ้นอยู่กับข้อมูลทั้งปีและกฎที่เกี่ยวข้อง",
        ],
      },
      {
        heading: "ข้อมูลที่ควรตรวจ",
        paragraphs: [
          "หากเอกสารผิดหรือไม่ครบ ควรติดต่อผู้จ่ายเพื่อแก้ไขก่อนนำยอดไปใช้",
        ],
        checklist: [
          "ชื่อและข้อมูลผู้จ่าย",
          "วันที่หรือปีที่จ่าย",
          "ยอดรายได้และยอดภาษีที่หัก",
          "ความครบถ้วนของหนังสือรับรอง",
        ],
      },
    ],
    sources: [revenueCodeSource, formsSource],
    relatedSlugs: ["pnd91", "pnd94", "tax-basics"],
  },
  {
    slug: "tax-calendar",
    category: "แบบภาษี",
    title: "ตรวจปฏิทินภาษีจากแหล่งทางการ",
    summary:
      "ใช้รายการเตือนเพื่อวางแผน แต่ตรวจวันครบกำหนดและช่องทางยื่นล่าสุดกับกรมสรรพากรทุกครั้ง",
    keywords: ["ปฏิทิน", "กำหนดเวลา", "วันยื่น", "ภงด", "ออนไลน์"],
    readingMinutes: 2,
    version: "1.0.0",
    lastReviewedAt: reviewedAt,
    sections: [
      {
        heading: "อย่าใช้วันที่คงที่แทนประกาศล่าสุด",
        paragraphs: [
          "วันครบกำหนดและเงื่อนไขการยื่นออนไลน์อาจมีประกาศหรือการขยายเวลา จึงควรตรวจหน้าแบบและบริการยื่นของกรมสรรพากรใกล้วันดำเนินการ",
          "เว็บนี้ไม่ดึงข้อมูลกำหนดเวลาแบบเรียลไทม์และไม่ส่งการแจ้งเตือนอัตโนมัติ",
        ],
      },
      {
        heading: "วางแผนแบบมีระยะเผื่อ",
        paragraphs: [
          "เตรียมเอกสารและตรวจบัญชีผู้ใช้ก่อนวันสุดท้าย เพื่อลดความเสี่ยงจากข้อมูลไม่ครบหรือระบบหนาแน่น",
        ],
        checklist: [
          "ตรวจแบบที่ต้องใช้",
          "ตรวจวันครบกำหนดจากประกาศล่าสุด",
          "เตรียมเอกสารและช่องทางชำระ",
          "เก็บหลักฐานการยื่นและชำระ",
        ],
      },
    ],
    sources: [formsSource],
    relatedSlugs: ["pnd94", "pnd91", "faq"],
  },
  {
    slug: "faq",
    category: "การใช้งานเว็บ",
    title: "คำถามที่พบบ่อยเกี่ยวกับเว็บ",
    summary:
      "คำตอบสั้น ๆ เรื่องผลประมาณการ การเก็บข้อมูล การทำงานออฟไลน์ และ Cloud Sync แบบสมัครใจ",
    keywords: ["คำถาม", "ข้อมูล", "ออฟไลน์", "cloud sync", "ผลประมาณการ"],
    readingMinutes: 4,
    version: "1.0.0",
    lastReviewedAt: reviewedAt,
    sections: [
      {
        heading: "ผลในเว็บใช้ยื่นภาษีได้เลยหรือไม่",
        paragraphs: [
          "ไม่ได้ ผลคำนวณและรายงานเป็นเครื่องมือช่วยจัดระเบียบและประมาณการเบื้องต้น ผู้ใช้ต้องตรวจแบบ เอกสาร และกฎล่าสุดก่อนยื่นจริง",
        ],
      },
      {
        heading: "ข้อมูลถูกส่งขึ้น Cloud หรือไม่",
        paragraphs: [
          "ค่าเริ่มต้นเป็น Local-first ข้อมูลอยู่ในอุปกรณ์ ผู้ใช้ต้องเข้าสู่ระบบและเปิด Cloud Sync ด้วยตนเองจึงจะส่งสำเนา Workspace ผ่านระบบที่กำหนด",
        ],
      },
      {
        heading: "ใช้งานออฟไลน์ได้แค่ไหน",
        paragraphs: [
          "หลังเปิดเว็บออนไลน์อย่างน้อยหนึ่งครั้ง เครื่องคำนวณและ PDF ที่รองรับสามารถทำงานออฟไลน์ได้ ส่วนการเข้าสู่ระบบและ Cloud Sync ต้องใช้อินเทอร์เน็ต",
        ],
      },
    ],
    sources: [formsSource],
    relatedSlugs: ["tax-basics", "tax-calendar", "pnd91"],
  },
] as const;

export const knowledgeCategories: readonly KnowledgeCategory[] = [
  "พื้นฐาน",
  "แบบภาษี",
  "เตรียมข้อมูล",
  "การใช้งานเว็บ",
];

export function getKnowledgeArticle(slug: string) {
  return knowledgeArticles.find((article) => article.slug === slug);
}

export function searchKnowledgeArticles(
  query: string,
  category: KnowledgeCategory | "ทั้งหมด" = "ทั้งหมด",
) {
  const normalizedQuery = query.trim().toLocaleLowerCase("th-TH");

  return knowledgeArticles.filter((article) => {
    if (category !== "ทั้งหมด" && article.category !== category) return false;
    if (!normalizedQuery) return true;

    const searchableText = [
      article.title,
      article.summary,
      article.category,
      ...article.keywords,
      ...article.sections.flatMap((section) => [
        section.heading,
        ...section.paragraphs,
        ...(section.checklist ?? []),
      ]),
    ]
      .join(" ")
      .toLocaleLowerCase("th-TH");

    return searchableText.includes(normalizedQuery);
  });
}

export function formatKnowledgeReviewDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

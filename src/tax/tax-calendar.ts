export interface TaxCalendarSource {
  readonly authority: string;
  readonly checkedAt: string;
  readonly title: string;
  readonly url: string;
}

export interface TaxCalendarChannel {
  readonly deadline: string;
  readonly label: string;
}

export interface TaxCalendarEntry {
  readonly channels: readonly TaxCalendarChannel[];
  readonly description: string;
  readonly formLabel: string;
  readonly source: TaxCalendarSource;
  readonly taxYearBE: number;
  readonly title: string;
}

/**
 * Read-only filing dates that have been manually checked against the Revenue
 * Department. This is intentionally local static content: visiting the
 * calendar never sends workspace or financial data to an external service.
 */
const TAX_CALENDAR_ENTRIES: readonly TaxCalendarEntry[] = [
  {
    title: "ยื่นแบบภาษีเงินได้บุคคลธรรมดาครึ่งปี",
    formLabel: "ภ.ง.ด.94",
    taxYearBE: 2569,
    description: "กำหนดยื่นแบบผ่านอินเทอร์เน็ตสำหรับเงินได้ครึ่งปี",
    channels: [
      {
        label: "ยื่นผ่านอินเทอร์เน็ต",
        deadline: "2026-10-08",
      },
    ],
    source: {
      authority: "กรมสรรพากร",
      checkedAt: "2026-10-04",
      title: "ปฏิทินภาษีอากร: กำหนดยื่น ภ.ง.ด.94 ทางอินเทอร์เน็ต",
      url: "https://www.rd.go.th/272.html",
    },
  },
  {
    title: "ยื่นแบบภาษีเงินได้บุคคลธรรมดาประจำปี",
    formLabel: "ภ.ง.ด.90/91",
    taxYearBE: 2568,
    description: "กำหนดยื่นแบบสำหรับรายได้ของปีภาษี 2568",
    channels: [
      {
        label: "ยื่นแบบกระดาษ",
        deadline: "2026-03-31",
      },
      {
        label: "ยื่นผ่าน e-Filing",
        deadline: "2026-04-08",
      },
    ],
    source: {
      authority: "กรมสรรพากร",
      checkedAt: "2026-10-04",
      title: "ได้เวลายื่นภาษีแล้ว: ภ.ง.ด.90/91 ปีภาษี 2568",
      url: "https://www.rd.go.th/fileadmin/user_upload/lorkhor/newsbanner/2026/01/PR1161_15012569.pdf",
    },
  },
];

/**
 * Returns a public, static schedule only. It intentionally has no workspace,
 * account, calculation, notification, or network dependency.
 */
export function getTaxCalendarEntries(): readonly TaxCalendarEntry[] {
  return TAX_CALENDAR_ENTRIES;
}

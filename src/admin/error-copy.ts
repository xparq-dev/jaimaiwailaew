import { AdminApiError } from "./governance-client";

const ERROR_MESSAGES: Record<string, string> = {
  admin_api_unconfigured: "ยังไม่ได้ตั้งค่า API สำหรับพื้นที่ผู้ดูแล",
  admin_authority_required: "บัญชีนี้ไม่มีสิทธิ์ดูแลกฎภาษี",
  artifact_edit_not_allowed: "แก้ไขไม่ได้ระหว่างรอตรวจ อนุมัติ หรือหลังเผยแพร่",
  artifact_identity_mismatch:
    "รหัสชุดกฎหรือเวอร์ชันในเนื้อหาไม่ตรงกับรายการที่เปิดอยู่",
  artifact_object_missing:
    "ไม่พบไฟล์ candidate ในพื้นที่จัดเก็บ กรุณาติดต่อผู้ดูแลระบบ",
  artifact_revision_conflict:
    "มีการบันทึกเวอร์ชันใหม่จากอีกหน้าต่าง กรุณาโหลดข้อมูลล่าสุด",
  authentication_required: "กรุณาเข้าสู่ระบบอีกครั้ง",
  current_artifact_checksum_required:
    "กรุณาบันทึก candidate ล่าสุดก่อนดำเนินการ",
  governance_history_conflict:
    "สถานะถูกเปลี่ยนจากอีกหน้าต่าง กรุณาโหลดข้อมูลล่าสุด",
  invalid_governance_history:
    "ขั้นตอนนี้ต้องใช้บัญชีคนละบัญชีกับผู้ส่งตรวจหรือผู้อนุมัติก่อนหน้า",
  governance_role_not_authorized: "บทบาทของคุณไม่อนุญาตให้ทำขั้นตอนนี้",
  mfa_required: "กรุณายืนยันตัวตนขั้นที่สองก่อนเปิดพื้นที่ผู้ดูแล",
  publication_not_ready: "candidate ยังไม่ผ่านเงื่อนไขสำหรับเผยแพร่",
};

export function adminErrorCopy(error: unknown) {
  if (error instanceof AdminApiError) {
    return ERROR_MESSAGES[error.code] ?? `ดำเนินการไม่สำเร็จ (${error.status})`;
  }
  return "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองอีกครั้ง";
}

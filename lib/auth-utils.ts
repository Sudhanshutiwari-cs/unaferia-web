/** Internal email domain used to back mobile+password accounts. */
const PHONE_EMAIL_DOMAIN = "customer.shouryaquest.app"

/** Keep only digits from a raw phone input. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "")
}

/** Validate an Indian 10-digit mobile number. */
export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone)
}

/** Map a normalized phone number to its backing account email. */
export function phoneToEmail(phone: string): string {
  return `${phone}@${PHONE_EMAIL_DOMAIN}`
}

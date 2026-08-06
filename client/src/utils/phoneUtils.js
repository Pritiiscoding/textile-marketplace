export const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91", country: "India" },
  { code: "+1", label: "🇺🇸 +1", country: "US/Canada" },
  { code: "+44", label: "🇬🇧 +44", country: "UK" },
  { code: "+86", label: "🇨🇳 +86", country: "China" },
  { code: "+971", label: "🇦🇪 +971", country: "UAE" },
  { code: "+65", label: "🇸🇬 +65", country: "Singapore" },
  { code: "+61", label: "🇦🇺 +61", country: "Australia" },
  { code: "+49", label: "🇩🇪 +49", country: "Germany" },
  { code: "+33", label: "🇫🇷 +33", country: "France" },
  { code: "+81", label: "🇯🇵 +81", country: "Japan" },
  { code: "+82", label: "🇰🇷 +82", country: "South Korea" },
  { code: "+880", label: "🇧🇩 +880", country: "Bangladesh" },
  { code: "+92", label: "🇵🇰 +92", country: "Pakistan" },
  { code: "+94", label: "🇱🇰 +94", country: "Sri Lanka" },
  { code: "+977", label: "🇳🇵 +977", country: "Nepal" },
];

export const DEFAULT_COUNTRY_CODE = "+91";

/** Parse a stored phone string into country code + local number */
export const parsePhone = (phone) => {
  if (!phone?.trim()) return { countryCode: DEFAULT_COUNTRY_CODE, number: "" };

  const trimmed = phone.trim();
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const { code } of sorted) {
    if (trimmed.startsWith(code)) {
      return { countryCode: code, number: trimmed.slice(code.length).trim() };
    }
  }
  return { countryCode: DEFAULT_COUNTRY_CODE, number: trimmed.replace(/^\+/, "") };
};

/** Combine country code and local number into a single stored string */
export const formatPhone = (countryCode, number) => {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "";
  return `${countryCode} ${digits}`;
};

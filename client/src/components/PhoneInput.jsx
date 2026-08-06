import { useState, useEffect } from "react";
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY_CODE,
  parsePhone,
  formatPhone,
} from "../utils/phoneUtils";

/**
 * Phone input with country code selector.
 * @param {string} value - Full phone string e.g. "+91 9876543210"
 * @param {function} onChange - Called with full formatted phone string
 * @param {string} id - Input id
 * @param {string} className - Extra classes for the number input
 * @param {boolean} required
 */
const PhoneInput = ({ value = "", onChange, id, className = "", required = false }) => {
  const parsed = parsePhone(value);
  const [countryCode, setCountryCode] = useState(parsed.countryCode);
  const [number, setNumber] = useState(parsed.number);

  useEffect(() => {
    const p = parsePhone(value);
    setCountryCode(p.countryCode);
    setNumber(p.number);
  }, [value]);

  const emit = (code, num) => {
    onChange(formatPhone(code, num));
  };

  const handleCodeChange = (e) => {
    const code = e.target.value;
    setCountryCode(code);
    emit(code, number);
  };

  const handleNumberChange = (e) => {
    const num = e.target.value.replace(/[^\d\s-]/g, "");
    setNumber(num);
    emit(countryCode, num);
  };

  const selectClass =
    "rounded-l-xl border border-r-0 border-surface-200 bg-surface-50 px-2 py-2.5 text-sm text-brand-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
  const inputClass =
    className ||
    "input-field rounded-l-none flex-1";

  return (
    <div className="flex">
      <select
        value={countryCode}
        onChange={handleCodeChange}
        aria-label="Country code"
        className={selectClass}
      >
        {COUNTRY_CODES.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        value={number}
        onChange={handleNumberChange}
        placeholder="98765 43210"
        required={required}
        className={inputClass}
      />
    </div>
  );
};

export default PhoneInput;

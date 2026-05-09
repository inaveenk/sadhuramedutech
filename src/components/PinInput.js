import React, { useEffect, useMemo, useRef } from "react";

function onlyDigits(s) {
  return String(s || "").replace(/\D/g, "");
}

export default function PinInput({
  value,
  onChange,
  length = 6,
  autoFocus = false,
  name = "pin",
  autoComplete = "one-time-code",
  disabled = false,
}) {
  const digits = useMemo(() => {
    const v = onlyDigits(value).slice(0, length);
    return Array.from({ length }, (_, i) => v[i] || "");
  }, [value, length]);

  const refs = useRef([]);

  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => {
      refs.current?.[0]?.focus?.();
    }, 0);
    return () => clearTimeout(t);
  }, [autoFocus]);

  const setAt = (idx, ch) => {
    const next = digits.slice();
    next[idx] = ch;
    onChange?.(next.join(""));
  };

  const handleChange = (idx, e) => {
    const raw = e.target.value;
    const d = onlyDigits(raw);

    // If user pasted/typed multiple digits into one box, spread forward.
    if (d.length > 1) {
      const next = digits.slice();
      let cursor = idx;
      for (const ch of d) {
        if (cursor >= length) break;
        next[cursor] = ch;
        cursor += 1;
      }
      onChange?.(next.join(""));
      const focusIdx = Math.min(length - 1, cursor);
      refs.current?.[focusIdx]?.focus?.();
      return;
    }

    setAt(idx, d);
    if (d && idx < length - 1) {
      refs.current?.[idx + 1]?.focus?.();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        setAt(idx, "");
        return;
      }
      if (idx > 0) {
        e.preventDefault();
        refs.current?.[idx - 1]?.focus?.();
        setAt(idx - 1, "");
      }
    } else if (e.key === "ArrowLeft") {
      if (idx > 0) refs.current?.[idx - 1]?.focus?.();
    } else if (e.key === "ArrowRight") {
      if (idx < length - 1) refs.current?.[idx + 1]?.focus?.();
    }
  };

  const handlePaste = (idx, e) => {
    const txt = e.clipboardData?.getData("text") || "";
    const d = onlyDigits(txt);
    if (!d) return;
    e.preventDefault();

    const next = digits.slice();
    let cursor = idx;
    for (const ch of d) {
      if (cursor >= length) break;
      next[cursor] = ch;
      cursor += 1;
    }
    onChange?.(next.join(""));
    const focusIdx = Math.min(length - 1, cursor);
    refs.current?.[focusIdx]?.focus?.();
  };

  return (
    <div className="pin-input" aria-label="PIN input">
      {digits.map((d, idx) => (
        <input
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          className="pin-input__box"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length}
          value={d}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={(e) => handlePaste(idx, e)}
          autoComplete={autoComplete}
          name={idx === 0 ? name : undefined}
          disabled={disabled}
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
}


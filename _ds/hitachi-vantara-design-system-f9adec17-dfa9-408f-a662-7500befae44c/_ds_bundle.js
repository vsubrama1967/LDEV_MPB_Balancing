/* @ds-bundle: {"format":3,"namespace":"HitachiVantaraDesignSystem_f9adec","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Stat","sourcePath":"components/feedback/Stat.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"6b7070271340","components/core/Button.jsx":"6bcca41cc7ef","components/core/Card.jsx":"c5be94f84fe1","components/core/IconButton.jsx":"8c5688a91e67","components/feedback/Alert.jsx":"f0c19cc33049","components/feedback/Stat.jsx":"36ff56fbbbdd","components/forms/Checkbox.jsx":"05df1e0783cc","components/forms/Input.jsx":"4f47cda6b19d","components/forms/Select.jsx":"ded5d4544ee0","components/forms/Switch.jsx":"6e350b534680","components/navigation/Tabs.jsx":"16b36b91f0b5","ui_kits/vsp-one-console/console.app.js":"f352f4091117"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HitachiVantaraDesignSystem_f9adec = window.HitachiVantaraDesignSystem_f9adec || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  neutral: {
    bg: "var(--hv-gray-1)",
    fg: "var(--hv-gray-6)",
    bd: "var(--hv-gray-2)"
  },
  brand: {
    bg: "var(--color-brand)",
    fg: "var(--text-on-brand)",
    bd: "var(--color-brand)"
  },
  wash: {
    bg: "var(--hv-red-halftone)",
    fg: "var(--hv-red-2)",
    bd: "var(--hv-red-tint-20)"
  },
  dark: {
    bg: "var(--hv-black)",
    fg: "var(--text-on-dark)",
    bd: "var(--hv-black)"
  },
  success: {
    bg: "#E6F7EE",
    fg: "var(--hv-green-3)",
    bd: "#BDEBD3"
  },
  warning: {
    bg: "#FFF0E0",
    fg: "var(--hv-orange-3)",
    bd: "#FFD9B3"
  },
  info: {
    bg: "#E6F0FF",
    fg: "var(--hv-blue-3)",
    bd: "#BFD7FF"
  }
};

/** Small status / category label. */
function Badge({
  children,
  tone = "neutral",
  solid = false,
  style = {},
  ...rest
}) {
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-1)",
      padding: "3px 9px",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--fs-caption)",
      fontWeight: "var(--fw-semibold)",
      lineHeight: 1.4,
      borderRadius: "var(--radius-sm)",
      background: solid ? t.fg : t.bg,
      color: solid ? "#fff" : t.fg,
      border: `var(--border-w) solid ${solid ? t.fg : t.bd}`,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: {
    padding: "6px 14px",
    fontSize: "var(--fs-body-sm)",
    height: 32
  },
  md: {
    padding: "9px 20px",
    fontSize: "var(--fs-body)",
    height: 40
  },
  lg: {
    padding: "13px 28px",
    fontSize: "var(--fs-body-lg)",
    height: 52
  }
};
const base = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--space-2)",
  fontFamily: "var(--font-sans)",
  fontWeight: "var(--fw-semibold)",
  lineHeight: 1,
  border: "var(--border-w) solid transparent",
  borderRadius: "var(--radius-sm)",
  cursor: "pointer",
  textDecoration: "none",
  whiteSpace: "nowrap",
  transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)"
};
function variantStyle(variant) {
  switch (variant) {
    case "secondary":
      return {
        background: "transparent",
        color: "var(--text-primary)",
        borderColor: "var(--hv-gray-3)"
      };
    case "ghost":
      return {
        background: "transparent",
        color: "var(--text-primary)",
        borderColor: "transparent"
      };
    case "dark":
      return {
        background: "var(--hv-black)",
        color: "var(--text-on-dark)",
        borderColor: "var(--hv-black)"
      };
    case "primary":
    default:
      return {
        background: "var(--color-brand)",
        color: "var(--text-on-brand)",
        borderColor: "var(--color-brand)"
      };
  }
}

/**
 * Primary action control. Red "primary" is the brand's call-to-action.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  iconStart = null,
  iconEnd = null,
  as = "button",
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const sz = sizes[size] || sizes.md;
  const v = variantStyle(variant);
  let bg = v.background;
  let bc = v.borderColor;
  let color = v.color;
  if (!disabled) {
    if (variant === "primary") {
      if (active) {
        bg = bc = "var(--color-brand-active)";
      } else if (hover) {
        bg = bc = "var(--color-brand-hover)";
      }
    } else if (variant === "dark") {
      if (hover) {
        bg = bc = "var(--hv-gray-6)";
      }
    } else if (variant === "secondary") {
      if (active) {
        bg = "var(--hv-gray-2)";
      } else if (hover) {
        bg = "var(--hv-gray-1)";
        bc = "var(--hv-gray-4)";
      }
    } else if (variant === "ghost") {
      if (active) {
        bg = "var(--hv-gray-2)";
      } else if (hover) {
        bg = "var(--hv-gray-1)";
      }
    }
  }
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    disabled: Tag === "button" ? disabled : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      ...base,
      ...sz,
      padding: sz.padding,
      background: bg,
      color,
      borderColor: bc,
      width: fullWidth ? "100%" : undefined,
      opacity: disabled ? 0.4 : 1,
      pointerEvents: disabled ? "none" : undefined,
      ...style
    }
  }, rest), iconStart, children, iconEnd);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Surface container. Flat by default with a hairline border; set
 * elevation for a soft shadow, accent for the signature red top rule.
 */
function Card({
  children,
  elevation = "none",
  accent = false,
  padding = "var(--space-6)",
  interactive = false,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const shadow = {
    none: "var(--shadow-none)",
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)"
  }[elevation] || "none";
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      position: "relative",
      background: "var(--surface-card)",
      border: "var(--border-w) solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      boxShadow: interactive && hover ? "var(--shadow-md)" : shadow,
      padding,
      transition: "box-shadow var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard)",
      borderColor: interactive && hover ? "var(--hv-gray-3)" : "var(--border-subtle)",
      cursor: interactive ? "pointer" : undefined,
      overflow: "hidden",
      ...style
    }
  }, rest), accent && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "var(--border-w-accent)",
      background: "var(--color-brand)"
    }
  }), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: 32,
  md: 40,
  lg: 48
};

/**
 * Square icon-only button. Pass a 49px line-icon <img> or inline svg
 * as children; it inherits color via currentColor.
 */
function IconButton({
  children,
  variant = "ghost",
  size = "md",
  disabled = false,
  label,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const dim = sizes[size] || sizes.md;
  let bg = "transparent",
    color = "var(--text-primary)",
    bd = "transparent";
  if (variant === "primary") {
    bg = "var(--color-brand)";
    color = "#fff";
    bd = "var(--color-brand)";
  } else if (variant === "secondary") {
    bd = "var(--hv-gray-3)";
  }
  if (!disabled && hover) {
    if (variant === "primary") {
      bg = "var(--color-brand-hover)";
      bd = "var(--color-brand-hover)";
    } else {
      bg = "var(--hv-gray-1)";
    }
  }
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: dim,
      height: dim,
      padding: 0,
      background: bg,
      color,
      border: `var(--border-w) solid ${bd}`,
      borderRadius: "var(--radius-sm)",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1,
      transition: "background var(--dur-fast) var(--ease-standard)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
const tones = {
  info: {
    fg: "var(--hv-blue-3)",
    bg: "#E6F0FF",
    bd: "#BFD7FF"
  },
  success: {
    fg: "var(--hv-green-3)",
    bg: "#E6F7EE",
    bd: "#BDEBD3"
  },
  warning: {
    fg: "var(--hv-orange-3)",
    bg: "#FFF0E0",
    bd: "#FFD9B3"
  },
  danger: {
    fg: "var(--hv-red-2)",
    bg: "var(--hv-red-halftone)",
    bd: "var(--hv-red-tint-20)"
  }
};

/** Inline message banner with a leading red accent bar. */
function Alert({
  title,
  children,
  tone = "info",
  icon = null,
  onClose,
  style = {}
}) {
  const t = tones[tone] || tones.info;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: "flex",
      gap: "var(--space-3)",
      padding: "var(--space-4)",
      background: t.bg,
      border: `var(--border-w) solid ${t.bd}`,
      borderLeft: `var(--border-w-accent) solid ${t.fg}`,
      borderRadius: "var(--radius-sm)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      color: t.fg,
      flex: "0 0 auto",
      display: "inline-flex"
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-body)",
      color: "var(--text-primary)",
      marginBottom: children ? 2 : 0
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-secondary)"
    }
  }, children)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      border: "none",
      background: "none",
      cursor: "pointer",
      color: "var(--text-tertiary)",
      fontSize: 18,
      lineHeight: 1,
      padding: 0
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Stat.jsx
try { (() => {
/**
 * Big headline statistic — the brand's signature device for impact
 * figures ($13B+, 120+). The number is large and (by default) red.
 */
function Stat({
  value,
  label,
  sublabel,
  accent = true,
  align = "left",
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-1)",
      textAlign: align,
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-display-2)",
      fontWeight: "var(--fw-extrabold)",
      lineHeight: "var(--lh-tight)",
      letterSpacing: "var(--ls-tight)",
      color: accent ? "var(--color-brand)" : "var(--text-primary)"
    }
  }, value), label && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body-lg)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-primary)"
    }
  }, label), sublabel && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-secondary)"
    }
  }, sublabel));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Stat.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/** Checkbox with brand-red checked fill. */
function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  id,
  style = {}
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const toggle = e => {
    if (disabled) return;
    if (!isControlled) setInternal(e.target.checked);
    onChange && onChange(e);
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-2)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--fs-body)",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      flex: "0 0 18px",
      borderRadius: "var(--radius-xs)",
      border: `var(--border-w-thick) solid ${on ? "var(--color-brand)" : "var(--border-default)"}`,
      background: on ? "var(--color-brand)" : "var(--surface-card)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)"
    }
  }, on && /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "9",
    viewBox: "0 0 11 9",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 4.5L4 7.5L10 1",
    stroke: "#fff",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), /*#__PURE__*/React.createElement("input", {
    id: id,
    type: "checkbox",
    checked: on,
    onChange: toggle,
    disabled: disabled,
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Text input with brand-red focus ring and optional label/hint/error. */
function Input({
  label,
  hint,
  error,
  size = "md",
  prefix = null,
  disabled = false,
  id,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const pad = size === "sm" ? "7px 10px" : size === "lg" ? "13px 14px" : "10px 12px";
  const fs = size === "sm" ? "var(--fs-body-sm)" : "var(--fs-body)";
  const borderColor = error ? "var(--color-danger)" : focus ? "var(--hv-black)" : "var(--border-default)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      fontSize: "var(--fs-body-sm)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-primary)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      background: disabled ? "var(--hv-gray-1)" : "var(--surface-card)",
      border: `var(--border-w) solid ${borderColor}`,
      borderRadius: "var(--radius-sm)",
      padding: pad,
      boxShadow: focus && !error ? "0 0 0 3px var(--hv-red-halftone)" : "none",
      transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)"
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      color: "var(--text-tertiary)"
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      font: "inherit",
      fontSize: fs,
      color: "var(--text-primary)",
      minWidth: 0
    }
  }, rest))), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-caption)",
      color: error ? "var(--color-danger)" : "var(--text-tertiary)"
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Native select styled to match the brand, with a chevron. */
function Select({
  label,
  hint,
  size = "md",
  disabled = false,
  id,
  children,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const pad = size === "sm" ? "7px 34px 7px 10px" : size === "lg" ? "13px 38px 13px 14px" : "10px 36px 10px 12px";
  const fs = size === "sm" ? "var(--fs-body-sm)" : "var(--fs-body)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      fontSize: "var(--fs-body-sm)",
      fontWeight: "var(--fw-semibold)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: id,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: "100%",
      appearance: "none",
      WebkitAppearance: "none",
      font: "inherit",
      fontSize: fs,
      color: "var(--text-primary)",
      background: disabled ? "var(--hv-gray-1)" : "var(--surface-card)",
      border: `var(--border-w) solid ${focus ? "var(--hv-black)" : "var(--border-default)"}`,
      borderRadius: "var(--radius-sm)",
      padding: pad,
      outline: "none",
      boxShadow: focus ? "0 0 0 3px var(--hv-red-halftone)" : "none",
      cursor: disabled ? "default" : "pointer",
      transition: "border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)"
    }
  }, rest), children), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      color: "var(--text-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "8",
    viewBox: "0 0 12 8",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l5 5 5-5",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })))), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-tertiary)"
    }
  }, hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Toggle switch; red when on. */
function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  id,
  style = {}
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const toggle = e => {
    if (disabled) return;
    if (!isControlled) setInternal(e.target.checked);
    onChange && onChange(e);
  };
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-3)",
      fontFamily: "var(--font-sans)",
      fontSize: "var(--fs-body)",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 22,
      flex: "0 0 40px",
      borderRadius: "var(--radius-pill)",
      background: on ? "var(--color-brand)" : "var(--hv-gray-3)",
      position: "relative",
      transition: "background var(--dur-base) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: on ? 20 : 2,
      width: 18,
      height: 18,
      borderRadius: "var(--radius-circle)",
      background: "#fff",
      boxShadow: "var(--shadow-sm)",
      transition: "left var(--dur-base) var(--ease-out)"
    }
  })), /*#__PURE__*/React.createElement("input", {
    id: id,
    type: "checkbox",
    checked: on,
    onChange: toggle,
    disabled: disabled,
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/**
 * Underline tab bar; active tab marked by the brand-red rule.
 * `items`: [{ id, label }]. Controlled via value/onChange or uncontrolled.
 */
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  style = {}
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? (items[0] && items[0].id));
  const active = value !== undefined ? value : internal;
  const select = id => {
    if (value === undefined) setInternal(id);
    onChange && onChange(id);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-6)",
      borderBottom: "var(--border-w) solid var(--border-subtle)",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, items.map(it => {
    const on = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => select(it.id),
      style: {
        position: "relative",
        border: "none",
        background: "none",
        padding: "0 0 var(--space-3)",
        cursor: "pointer",
        fontSize: "var(--fs-body)",
        fontWeight: on ? "var(--fw-bold)" : "var(--fw-medium)",
        color: on ? "var(--text-primary)" : "var(--text-tertiary)",
        transition: "color var(--dur-fast) var(--ease-standard)"
      }
    }, it.label, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -1,
        height: "var(--border-w-accent)",
        background: "var(--color-brand)",
        opacity: on ? 1 : 0,
        transition: "opacity var(--dur-fast) var(--ease-standard)"
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/vsp-one-console/console.app.js
try { (() => {
// Plain-JS build of the VSP One console for the standalone bundle (no JSX / no
// Babel — avoids the bundler emitting a duplicate text/babel copy). Mounts once
// the design-system namespace is ready.
(function () {
  var h = React.createElement;
  var F = React.Fragment;
  var R = function (id) {
    return (window.__resources || {})[id];
  };
  function DS() {
    return window.HitachiVantaraDesignSystem_f9adec || {};
  }
  function Icon(p) {
    return h("img", {
      src: R(p.n),
      width: p.w || 20,
      height: p.w || 20,
      alt: ""
    });
  }
  var NAV = [{
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard"
  }, {
    id: "volumes",
    label: "Volumes",
    icon: "database"
  }, {
    id: "pools",
    label: "Storage Pools",
    icon: "server-rack"
  }, {
    id: "performance",
    label: "Performance",
    icon: "analytics"
  }, {
    id: "protection",
    label: "Data Protection",
    icon: "shield-check"
  }, {
    id: "alerts",
    label: "Alerts",
    icon: "ai-sync"
  }, {
    id: "settings",
    label: "Settings",
    icon: "gear"
  }];
  function Sidebar(p) {
    return h("aside", {
      className: "side"
    }, h("div", {
      className: "brand"
    }, h("div", null, h("img", {
      src: R("logoWhite"),
      alt: "Hitachi Vantara"
    }), h("div", {
      className: "sub"
    }, "VSP One Console"))), h("nav", null, NAV.map(function (n) {
      return h("button", {
        key: n.id,
        className: "navitem" + (p.active === n.id ? " active" : ""),
        onClick: function () {
          p.onNav(n.id);
        }
      }, h(Icon, {
        n: n.icon
      }), " ", n.label);
    })), h("div", {
      className: "foot"
    }, h("div", {
      className: "av"
    }, "JD"), h("div", null, h("div", {
      style: {
        fontWeight: 600
      }
    }, "Jordan Diaz"), h("div", {
      style: {
        opacity: .6,
        fontSize: 12
      }
    }, "Storage Admin"))));
  }
  function Topbar(p) {
    var d = DS();
    return h("div", {
      className: "topbar"
    }, h("h1", null, p.title), h("div", {
      className: "search"
    }, h(Icon, {
      n: "search",
      w: 18
    }), h("input", {
      placeholder: "Search volumes, pools, hosts\u2026"
    })), h("div", {
      className: "right"
    }, h(d.IconButton, {
      label: "Notifications"
    }, h(Icon, {
      n: "ai-sync"
    })), h(d.IconButton, {
      label: "Settings"
    }, h(Icon, {
      n: "gear"
    })), h(d.Button, {
      variant: "primary",
      size: "sm",
      iconStart: h(Icon, {
        n: "cursor",
        w: 16
      })
    }, "Provision")));
  }
  function Kpi(p) {
    var d = DS();
    return h(d.Card, {
      padding: "var(--space-5)"
    }, h("div", {
      className: "kpi"
    }, h("div", {
      className: "top"
    }, h("div", {
      className: "ic"
    }, h(Icon, {
      n: p.icon
    })), p.delta ? h("span", {
      className: "delta " + (p.up ? "up" : "down")
    }, (p.up ? "\u25B2" : "\u25BC") + " " + p.delta) : null), h("div", {
      className: "v"
    }, p.value), h("div", {
      className: "l"
    }, p.label)));
  }
  var ALERTS = [{
    sev: "var(--hv-red-1)",
    t: "Pool POOL-03 capacity at 92%",
    d: "Tiered pool nearing threshold \u2014 expansion recommended.",
    tm: "4m ago"
  }, {
    sev: "var(--hv-orange-2)",
    t: "Replication lag on vsp-fs-prod",
    d: "Async replication lag exceeded 30s for 5 minutes.",
    tm: "26m ago"
  }, {
    sev: "var(--hv-blue-2)",
    t: "Firmware update available",
    d: "VSP One Block 9.4.2 ready to stage.",
    tm: "1h ago"
  }, {
    sev: "var(--hv-green-3)",
    t: "Snapshot schedule completed",
    d: "1,204 volumes protected successfully.",
    tm: "3h ago"
  }];
  function Dashboard() {
    var d = DS();
    var usage = [{
      l: "Block",
      c: "var(--hv-red-1)",
      v: 42
    }, {
      l: "File",
      c: "var(--hv-gray-5)",
      v: 23
    }, {
      l: "Object",
      c: "var(--hv-gray-3)",
      v: 14
    }, {
      l: "Free",
      c: "var(--hv-gray-2)",
      v: 21
    }];
    var bars = [38, 52, 47, 61, 73, 95, 68, 55];
    var peak = bars.indexOf(Math.max.apply(Math, bars));
    return h(F, null, h("div", {
      className: "grid4"
    }, h(Kpi, {
      icon: "database",
      value: "1,248",
      label: "Active volumes",
      delta: "3.2%",
      up: true
    }), h(Kpi, {
      icon: "growth",
      value: "2.4M",
      label: "IOPS (avg)",
      delta: "8.1%",
      up: true
    }), h(Kpi, {
      icon: "server-rack",
      value: "1.6 PB",
      label: "Usable capacity"
    }), h(Kpi, {
      icon: "sustainability",
      value: "0.71",
      label: "Power usage effectiveness",
      delta: "5%"
    })), h("div", {
      className: "grid2"
    }, h(d.Card, {
      padding: "var(--space-6)"
    }, h("div", {
      className: "sectionhead"
    }, h("div", null, h("div", {
      className: "overline"
    }, "Capacity"), h("div", {
      className: "hv-h4"
    }, "1.26 PB used of 1.6 PB")), h(d.Button, {
      variant: "secondary",
      size: "sm"
    }, "Add capacity")), h("div", {
      className: "meter"
    }, usage.map(function (u) {
      return h("span", {
        key: u.l,
        style: {
          width: u.v + "%",
          background: u.c
        }
      });
    })), h("div", {
      className: "legend"
    }, usage.map(function (u) {
      return h("div", {
        className: "it",
        key: u.l
      }, h("span", {
        className: "dot",
        style: {
          background: u.c
        }
      }), " " + u.l + " \u00B7 " + u.v + "%");
    })), h("div", {
      className: "overline",
      style: {
        marginTop: 28
      }
    }, "Throughput \u00B7 last 8 hours (GB/s)"), h("div", {
      className: "bars"
    }, bars.map(function (b, i) {
      return h("div", {
        key: i,
        className: "b" + (i === peak ? " peak" : "")
      }, h("div", {
        className: "bar",
        style: {
          height: b + "%"
        }
      }), h("div", {
        className: "x"
      }, String(i * 3).padStart(2, "0") + ":00"));
    }))), h(d.Card, {
      padding: "var(--space-6)"
    }, h("div", {
      className: "sectionhead"
    }, h("div", {
      className: "overline"
    }, "Active alerts"), h(d.Badge, {
      tone: "brand",
      solid: true
    }, ALERTS.length)), ALERTS.map(function (a, i) {
      return h("div", {
        className: "alert-row",
        key: i
      }, h("span", {
        className: "sev",
        style: {
          background: a.sev
        }
      }), h("div", null, h("div", {
        className: "ti"
      }, a.t), h("div", {
        className: "de"
      }, a.d)), h("div", {
        className: "tm"
      }, a.tm));
    }), h("div", {
      style: {
        marginTop: 14
      }
    }, h(d.Button, {
      variant: "ghost",
      size: "sm"
    }, "View all alerts \u2192")))));
  }
  var VOLUMES = [{
    n: "vsp-blk-oracle-01",
    type: "Block",
    pool: "POOL-01",
    cap: "12.0 TB",
    used: 78,
    status: "online"
  }, {
    n: "vsp-blk-sap-prod",
    type: "Block",
    pool: "POOL-01",
    cap: "8.0 TB",
    used: 54,
    status: "online"
  }, {
    n: "vsp-fs-prod",
    type: "File",
    pool: "POOL-02",
    cap: "24.0 TB",
    used: 91,
    status: "warning"
  }, {
    n: "vsp-obj-archive",
    type: "Object",
    pool: "POOL-05",
    cap: "120 TB",
    used: 33,
    status: "online"
  }, {
    n: "vsp-blk-analytics",
    type: "Block",
    pool: "POOL-03",
    cap: "16.0 TB",
    used: 96,
    status: "warning"
  }, {
    n: "vsp-fs-home",
    type: "File",
    pool: "POOL-02",
    cap: "6.0 TB",
    used: 41,
    status: "online"
  }, {
    n: "vsp-sds-cache",
    type: "SDS Block",
    pool: "POOL-04",
    cap: "2.0 TB",
    used: 12,
    status: "offline"
  }];
  var STATUS = {
    online: {
      tone: "success",
      label: "Online"
    },
    warning: {
      tone: "warning",
      label: "Warning"
    },
    offline: {
      tone: "neutral",
      label: "Offline"
    }
  };
  function Volumes() {
    var d = DS();
    var st = React.useState("all");
    var tab = st[0],
      setTab = st[1];
    var rows = VOLUMES.filter(function (v) {
      return tab === "all" || v.type.toLowerCase().indexOf(tab) === 0;
    });
    return h(d.Card, {
      padding: "var(--space-6)"
    }, h(d.Tabs, {
      value: tab,
      onChange: setTab,
      items: [{
        id: "all",
        label: "All"
      }, {
        id: "block",
        label: "Block"
      }, {
        id: "file",
        label: "File"
      }, {
        id: "object",
        label: "Object"
      }, {
        id: "sds",
        label: "SDS"
      }]
    }), h("div", {
      className: "toolbar"
    }, h(d.Badge, {
      tone: "neutral"
    }, rows.length + " volumes"), h("div", {
      className: "sp"
    }), h(d.Button, {
      variant: "ghost",
      size: "sm",
      iconStart: h(Icon, {
        n: "funnel",
        w: 16
      })
    }, "Filter"), h(d.Button, {
      variant: "secondary",
      size: "sm",
      iconStart: h(Icon, {
        n: "download",
        w: 16
      })
    }, "Export")), h("table", null, h("thead", null, h("tr", null, h("th", null, "Volume"), h("th", null, "Type"), h("th", null, "Pool"), h("th", null, "Capacity"), h("th", null, "Utilization"), h("th", null, "Status"))), h("tbody", null, rows.map(function (v) {
      var s = STATUS[v.status];
      return h("tr", {
        key: v.n
      }, h("td", null, h("div", {
        className: "vname"
      }, v.n), h("div", {
        className: "vsub"
      }, "/dev/" + v.pool.toLowerCase())), h("td", null, v.type), h("td", null, v.pool), h("td", null, v.cap), h("td", null, h("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10
        }
      }, h("div", {
        className: "minibar"
      }, h("span", {
        className: v.used >= 90 ? "hot" : "",
        style: {
          width: v.used + "%"
        }
      })), h("span", {
        style: {
          fontSize: 13,
          color: "var(--text-secondary)"
        }
      }, v.used + "%"))), h("td", null, h(s ? DS().Badge : "span", {
        tone: s.tone
      }, s.label)));
    }))));
  }
  function Placeholder(p) {
    var d = DS();
    return h(d.Card, {
      padding: "var(--space-12)",
      style: {
        textAlign: "center",
        color: "var(--text-tertiary)"
      }
    }, h(Icon, {
      n: "gear",
      w: 40
    }), h("div", {
      className: "hv-h4",
      style: {
        marginTop: 12,
        color: "var(--text-secondary)"
      }
    }, p.title), h("div", {
      className: "hv-body-sm"
    }, "This screen is part of the kit scaffold."));
  }
  var TITLES = {
    dashboard: "Dashboard",
    volumes: "Volumes",
    pools: "Storage Pools",
    performance: "Performance",
    protection: "Data Protection",
    alerts: "Alerts",
    settings: "Settings"
  };

  // Error boundary + readiness gate: swallows any transient throw during the
  // bundler's unpack sequence and only renders App once the DS namespace is up.
  function Root() {
    var rs = React.useState(false);
    var ready = rs[0],
      setReady = rs[1];
    var es = React.useState(false);
    var errored = es[0],
      setErrored = es[1];
    React.useEffect(function () {
      var t;
      (function check() {
        var ns = window.HitachiVantaraDesignSystem_f9adec;
        if (ns && ns.Card && ns.IconButton) {
          setReady(true);
          setErrored(false);
        } else {
          t = setTimeout(check, 30);
        }
      })();
      return function () {
        clearTimeout(t);
      };
    }, [errored]);
    if (!ready) return h("div", {
      style: {
        padding: 40,
        color: "var(--text-tertiary)",
        fontFamily: "var(--font-sans)"
      }
    }, "Loading\u2026");
    return h(Boundary, {
      onError: function () {
        setReady(false);
        setErrored(true);
      }
    }, h(App, null));
  }
  var Boundary = function () {
    function B(props) {
      React.Component.call(this, props);
      this.state = {
        hit: false
      };
    }
    B.prototype = Object.create(React.Component.prototype);
    B.prototype.constructor = B;
    B.getDerivedStateFromError = function () {
      return {
        hit: true
      };
    };
    B.prototype.componentDidCatch = function () {
      if (this.props.onError) this.props.onError();
    };
    B.prototype.render = function () {
      return this.state.hit ? null : this.props.children;
    };
    return B;
  }();
  function App() {
    var st = React.useState("dashboard");
    var active = st[0],
      setActive = st[1];
    return h("div", {
      className: "app"
    }, h(Sidebar, {
      active: active,
      onNav: setActive
    }), h("div", {
      className: "main"
    }, h(Topbar, {
      title: TITLES[active]
    }), h("div", {
      className: "content"
    }, active === "dashboard" ? h(Dashboard, null) : active === "volumes" ? h(Volumes, null) : h(Placeholder, {
      title: TITLES[active]
    }))));
  }
  function mount() {
    var el = document.getElementById("vsp-root");
    if (!el || typeof ReactDOM === "undefined" || typeof React === "undefined") {
      setTimeout(mount, 30);
      return;
    }
    if (el.__vspRoot) return;
    el.__vspRoot = ReactDOM.createRoot(el);
    el.__vspRoot.render(h(Root, null));
  }
  mount();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/vsp-one-console/console.app.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

})();

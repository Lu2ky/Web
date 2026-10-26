/** Política de contraseñas y checklist visual. */

export function validatePasswordComplexity(password) {
  const value = String(password || "");

  if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (!/[a-z]/.test(value)) return "La contraseña debe incluir al menos una letra minúscula";
  if (!/[A-Z]/.test(value)) return "La contraseña debe incluir al menos una letra mayúscula";
  if (!/\d/.test(value)) return "La contraseña debe incluir al menos un número";
  if (!/[^A-Za-z0-9\s]/.test(value)) return "La contraseña debe incluir al menos un símbolo";

  return null;
}

export function getPasswordChecklist(password, currentPassword) {
  const value = String(password || "");
  const current = String(currentPassword || "");

  return [
    { id: "min-length", label: "Al menos 8 caracteres", met: value.length >= 8 },
    { id: "lowercase", label: "Al menos una letra minúscula", met: /[a-z]/.test(value) },
    { id: "uppercase", label: "Al menos una letra mayúscula", met: /[A-Z]/.test(value) },
    { id: "number", label: "Al menos un número", met: /\d/.test(value) },
    { id: "symbol", label: "Al menos un símbolo", met: /[^A-Za-z0-9\s]/.test(value) },
    {
      id: "different-current",
      label: "Debe ser diferente a la contraseña actual",
      met: value.length > 0 && current.length > 0 && value !== current,
    },
  ];
}

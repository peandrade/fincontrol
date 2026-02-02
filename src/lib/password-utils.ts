/**
 * Password utility functions for validation and strength calculation.
 */

export interface PasswordStrength {
  /** Score from 0-4 (0 = weak, 4 = very strong) */
  score: number;
  /** Human-readable label */
  label: string;
  /** Color class for UI display */
  color: string;
  /** Background color class for UI display */
  bgColor: string;
  /** Whether the password meets minimum requirements */
  isValid: boolean;
  /** List of requirements and their status */
  requirements: PasswordRequirement[];
}

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

// Password validation regex: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Calculate password strength and validation status.
 *
 * @param password - The password to evaluate
 * @returns Password strength information including score, label, and requirements
 *
 * @example
 * const strength = calculatePasswordStrength("MyPass123");
 * console.log(strength.score); // 3
 * console.log(strength.label); // "Forte"
 * console.log(strength.isValid); // true
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements: PasswordRequirement[] = [
    { label: "Pelo menos 8 caracteres", met: password.length >= 8 },
    { label: "Uma letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "Uma letra minúscula", met: /[a-z]/.test(password) },
    { label: "Um número", met: /\d/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLong = password.length >= 12;

  // Calculate score (0-4)
  let score = metCount;
  if (metCount === 4 && hasSpecialChar) score = 4;
  else if (metCount === 4 && isLong) score = 4;
  else if (metCount === 4) score = 3;
  else if (metCount >= 3) score = 2;
  else if (metCount >= 2) score = 1;
  else score = 0;

  // Map score to label and colors
  const scoreMap: Record<number, { label: string; color: string; bgColor: string }> = {
    0: { label: "Muito fraca", color: "text-red-400", bgColor: "bg-red-500" },
    1: { label: "Fraca", color: "text-orange-400", bgColor: "bg-orange-500" },
    2: { label: "Média", color: "text-yellow-400", bgColor: "bg-yellow-500" },
    3: { label: "Forte", color: "text-emerald-400", bgColor: "bg-emerald-500" },
    4: { label: "Muito forte", color: "text-emerald-400", bgColor: "bg-emerald-500" },
  };

  const { label, color, bgColor } = scoreMap[score];

  return {
    score,
    label,
    color,
    bgColor,
    isValid: metCount === 4,
    requirements,
  };
}

/**
 * Validate if a password meets the minimum requirements.
 *
 * @param password - The password to validate
 * @returns True if password is valid, false otherwise
 */
export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

/**
 * Simple password strength calculation (0-5 scale).
 * Used for visual password strength indicators.
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  return strength;
}

const STRENGTH_LABELS = ["Muito fraca", "Fraca", "Média", "Forte", "Muito forte"];
const STRENGTH_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

/**
 * Get human-readable label for password strength.
 */
export function getPasswordStrengthLabel(strength: number): string {
  if (strength <= 0) return "Digite uma senha";
  return STRENGTH_LABELS[Math.min(strength - 1, STRENGTH_LABELS.length - 1)];
}

/**
 * Get hex color for password strength indicator.
 */
export function getPasswordStrengthColor(strength: number): string {
  if (strength <= 0) return "var(--text-muted)";
  return STRENGTH_COLORS[Math.min(strength - 1, STRENGTH_COLORS.length - 1)];
}

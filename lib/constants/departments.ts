export const DEPARTMENTS = {
  HR: 'HR',
  FINANCE: 'Finance',
  MARKETING: 'Marketing',
  OPERATIONS: 'Operations',
  TECH: 'Tech',
  LEADERSHIP: 'Leadership',
  OTHER: 'Other',
} as const;

export type Department = (typeof DEPARTMENTS)[keyof typeof DEPARTMENTS];

/** Maps DB enum values to human-readable labels + colors */
export const DEPARTMENT_CONFIG: Record<
  Department,
  { label: string; color: string; emoji: string }
> = {
  HR: { label: 'Human Resources', color: 'violet', emoji: '👥' },
  Finance: { label: 'Finance', color: 'emerald', emoji: '💰' },
  Marketing: { label: 'Marketing', color: 'orange', emoji: '📣' },
  Operations: { label: 'Operations', color: 'blue', emoji: '⚙️' },
  Tech: { label: 'Technology', color: 'cyan', emoji: '💻' },
  Leadership: { label: 'Leadership', color: 'amber', emoji: '🎯' },
  Other: { label: 'Other', color: 'slate', emoji: '📁' },
};

export const DEPARTMENT_OPTIONS = Object.entries(DEPARTMENT_CONFIG).map(
  ([value, { label, emoji }]) => ({
    value: value as Department,
    label,
    emoji,
  })
);

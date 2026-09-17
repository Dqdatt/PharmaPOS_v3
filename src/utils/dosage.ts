// Cách uống (dosage) for a sold/exported item: one free-text slot per time of day.
export interface Dosage {
  sang: string;
  trua: string;
  chieu: string;
}

export type DosageSlot = keyof Dosage;

export const DOSAGE_SLOTS: { key: DosageSlot; label: string }[] = [
  { key: 'sang', label: 'Sáng' },
  { key: 'trua', label: 'Trưa' },
  { key: 'chieu', label: 'Chiều/Tối' },
];

export const DOSAGE_OPTIONS: Record<DosageSlot, string[]> = {
  sang: ['Sáng 1 viên trước ăn 30 phút', 'Sáng 1 viên', 'Sáng 2 viên', 'Sáng ½ viên', 'Sáng 1 gói'],
  trua: ['Trưa 1 viên', 'Trưa 2 viên', 'Trưa ½ viên', 'Trưa 1 gói'],
  chieu: [
    'Chiều 1 viên', 'Chiều 2 viên', 'Chiều ½ viên', 'Chiều 1 gói',
    'Tối 1 viên', 'Tối 2 viên', 'Tối ½ viên', 'Tối 1 gói',
  ],
};

export const emptyDosage = (): Dosage => ({ sang: '', trua: '', chieu: '' });

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const hasDosage = (dosage?: Partial<Dosage> | null) =>
  !!dosage && DOSAGE_SLOTS.some(({ key }) => clean(dosage[key]) !== '');

export const getDosageParts = (dosage?: Partial<Dosage> | null) =>
  dosage ? DOSAGE_SLOTS.map(({ key }) => clean(dosage[key])).filter(Boolean) : [];

// Single line printed under the product name, e.g. "Sáng 1 viên – Chiều 1 viên".
export const formatDosage = (dosage?: Partial<Dosage> | null) => getDosageParts(dosage).join(' – ');

// Non-breaking spaces keep "Tối 1 gói" / "30 phút" together on paper while still letting a
// long line wrap between phrases, so narrow A5 tables never overflow.
export const keepDosePhraseTogether = (part: string) =>
  part.replace(/^(\S+) /, '$1\u00A0').replace(/(\d+|½) /g, '$1\u00A0');

type DosageItem = { dosageEnabled?: boolean; dosage?: Partial<Dosage> | null };

// Parts shown for an invoice item; empty when the toggle is off so the invoice prints as before.
export const getPrintableDosageParts = (item: DosageItem) =>
  item.dosageEnabled ? getDosageParts(item.dosage) : [];

export const getPrintableDosage = (item: DosageItem) => getPrintableDosageParts(item).join(' – ');

// Value written to the `dosage` column: null when the toggle is off or nothing was filled.
export const toDbDosage = (enabled: boolean | undefined, dosage?: Partial<Dosage> | null): Dosage | null => {
  if (!enabled || !hasDosage(dosage)) return null;
  return { sang: clean(dosage!.sang), trua: clean(dosage!.trua), chieu: clean(dosage!.chieu) };
};

// Reads the `dosage` column defensively (missing column, null, or malformed JSON).
export const fromDbDosage = (value: unknown): Dosage | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const dosage = { sang: clean(raw.sang), trua: clean(raw.trua), chieu: clean(raw.chieu) };
  return hasDosage(dosage) ? dosage : undefined;
};

// Accent-insensitive match so typing "sang 1" finds "Sáng 1 viên".
export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

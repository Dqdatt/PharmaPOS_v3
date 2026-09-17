import { useState, useRef, useEffect } from 'react';
import { Dosage, DOSAGE_OPTIONS, DOSAGE_SLOTS, emptyDosage, getPrintableDosageParts, keepDosePhraseTogether, normalizeSearch } from '../utils/dosage';

// Dosage line under a product name; renders nothing when the toggle is off or all slots are empty.
export function DosageText({ item, className }: { item: { dosageEnabled?: boolean; dosage?: Dosage }; className?: string }) {
  const parts = getPrintableDosageParts(item);
  if (parts.length === 0) return null;
  return <div className={className}>{parts.map(keepDosePhraseTogether).join(' – ')}</div>;
}

// Toggle switch styled like the existing "CHI PHÍ KHÁC" switch.
export function DosageToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title="Cách uống"
      className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${enabled ? 'bg-teal-500' : 'bg-gray-300'}`}
    >
      <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
    </button>
  );
}

// The three Sáng / Trưa / Chiều-Tối fields shown while the toggle is on.
export function DosageFields({ dosage, onChange }: { dosage?: Dosage; onChange: (dosage: Dosage) => void }) {
  const current = dosage || emptyDosage();
  return (
    <div className="grid grid-cols-3 gap-2">
      {DOSAGE_SLOTS.map(({ key, label }) => (
        <div key={key}>
          <DosageAutocomplete
            label={label}
            options={DOSAGE_OPTIONS[key]}
            value={current[key]}
            onChange={v => onChange({ ...current, [key]: v })}
          />
        </div>
      ))}
    </div>
  );
}

interface Props {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export default function DosageAutocomplete({ label, options, value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const term = normalizeSearch(value);
  // Show the full list when the field is empty or already holds an exact option.
  const filteredOptions = !term || options.includes(value)
    ? options
    : options.filter(o => normalizeSearch(o).includes(term));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-[11px] font-bold text-gray-500 mb-0.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={label}
        title={value || label}
        className="w-full p-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-[100] min-w-full w-max max-w-[16rem] bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1 left-0">
          {filteredOptions.map(o => (
            <li
              key={o}
              className={`px-3 py-2 text-sm hover:bg-teal-50 cursor-pointer border-b last:border-0 ${o === value ? 'bg-teal-50 font-medium text-teal-700' : 'text-gray-800'}`}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                onChange(o);
                setIsOpen(false);
              }}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

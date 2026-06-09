import { useState, useRef, useEffect } from 'react';
import { Supplier } from '../contexts/PosContext';

interface Props {
  suppliers: Supplier[];
  value: number | '';
  onChange: (supplierId: number | '') => void;
  disabled?: boolean;
}

export default function SupplierAutocomplete({ suppliers, value, onChange, disabled }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = suppliers.find(x => x.id === value);
    if (s) {
      setSearchTerm(`${s.code} - ${s.name}`);
    } else {
      setSearchTerm('');
    }
  }, [value, suppliers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const s = suppliers.find(x => x.id === value);
        if (s && searchTerm !== `${s.code} - ${s.name}`) {
          setSearchTerm(`${s.code} - ${s.name}`);
        } else if (!s) {
          setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value, suppliers, searchTerm]);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={e => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          if (e.target.value === '') onChange('');
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Gõ để tìm nhà cung cấp..."
        disabled={disabled}
        className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      {isOpen && !disabled && (
        <ul className="absolute z-[100] w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1 left-0">
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map(s => (
              <li
                key={s.id}
                className="px-3 py-2 text-sm hover:bg-teal-50 cursor-pointer border-b last:border-0"
                onClick={() => {
                  setSearchTerm(`${s.code} - ${s.name}`);
                  onChange(s.id);
                  setIsOpen(false);
                }}
              >
                <div className="font-medium text-gray-800">{s.name}</div>
                <div className="text-xs text-gray-500">{s.code}</div>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-gray-500 text-center">Không tìm thấy</li>
          )}
        </ul>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';

interface Bank {
  bin: string;
  shortName: string;
  name: string;
}

interface Props {
  banks: Bank[];
  value: string;
  onChange: (bankBin: string) => void;
}

export default function BankAutocomplete({ banks, value, onChange }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const b = banks.find(x => x.bin === value);
    if (b) {
      setSearchTerm(`${b.shortName} - ${b.name}`);
    } else {
      setSearchTerm('');
    }
  }, [value, banks]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const b = banks.find(x => x.bin === value);
        if (b && searchTerm !== `${b.shortName} - ${b.name}`) {
          setSearchTerm(`${b.shortName} - ${b.name}`);
        } else if (!b) {
          setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value, banks, searchTerm]);

  const filteredBanks = banks.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.shortName.toLowerCase().includes(searchTerm.toLowerCase())
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
        placeholder="Gõ để tìm ngân hàng..."
        className="w-full border rounded-lg p-2 outline-none focus:border-teal-500 bg-white text-sm"
      />
      {isOpen && (
        <ul className="absolute z-[100] w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1 left-0">
          {filteredBanks.length > 0 ? (
            filteredBanks.map(b => (
              <li
                key={b.bin}
                className="px-3 py-2 text-sm hover:bg-teal-50 cursor-pointer border-b last:border-0"
                onClick={() => {
                  setSearchTerm(`${b.shortName} - ${b.name}`);
                  onChange(b.bin);
                  setIsOpen(false);
                }}
              >
                <div className="font-medium text-gray-800">{b.shortName}</div>
                <div className="text-xs text-gray-500">{b.name}</div>
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

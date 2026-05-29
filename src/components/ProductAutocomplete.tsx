import { useState, useRef, useEffect } from 'react';
import { Product } from '../contexts/PosContext';

interface Props {
  products: Product[];
  value: number | '';
  onChange: (productId: number | '') => void;
  error?: boolean;
}

export default function ProductAutocomplete({ products, value, onChange, error }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = products.find(x => x.id === value);
    if (p) {
      setSearchTerm(p.name);
    } else {
      setSearchTerm('');
    }
  }, [value, products]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const p = products.find(x => x.id === value);
        if (p && searchTerm !== p.name) {
          setSearchTerm(p.name);
        } else if (!p) {
          setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, value, products, searchTerm]);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={searchTerm}
        onChange={e => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Gõ để tìm..."
        className={`w-full p-1 border rounded text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none ${error ? 'border-red-500 bg-red-50' : 'bg-white'}`}
      />
      {isOpen && (
        <ul className="absolute z-[100] w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1 left-0">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <li
                key={p.id}
                className="px-2 py-1.5 text-xs hover:bg-teal-50 cursor-pointer border-b last:border-0 flex justify-between items-center gap-2"
                onClick={() => {
                  setSearchTerm(p.name);
                  onChange(p.id);
                  setIsOpen(false);
                }}
              >
                <span className="font-medium truncate">{p.name}</span>
                <span className="text-gray-500 font-mono whitespace-nowrap text-[11px]">
                  Tồn: {p.initialStock + p.totalIn - p.totalOut} {p.unit}
                </span>
              </li>
            ))
          ) : (
            <li className="px-2 py-1.5 text-xs text-gray-500 text-center">Không tìm thấy</li>
          )}
        </ul>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = ({
  value: initialValue = '',
  onChange,
  onEnter,
  placeholder = 'Поиск по таблице...',
  debounceMs = 400,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== initialValue) {
        onChange(searchTerm);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [searchTerm, debounceMs, onChange, initialValue]);

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  // USB-сканер штрихкодов вводит символы и жмёт Enter -> один точный запрос
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onEnter) {
      e.preventDefault();
      onEnter(searchTerm.trim());
    }
  };

  return (
    <div className="relative flex items-center">
      <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#94a3b8] pointer-events-none" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full sm:w-64 pl-8 pr-7 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all shadow-2xs"
      />
      {searchTerm && (
        <button
          onClick={handleClear}
          className="absolute right-2 text-[#94a3b8] hover:text-[#475569] p-0.5 rounded transition-colors"
          title="Очистить"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;

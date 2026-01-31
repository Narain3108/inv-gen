/**
 * Search Input Component
 */

'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { debounce } from '@/utils/helpers';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
}

export default function SearchInput({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  className = '',
}: SearchInputProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const debouncedSearch = debounce((query: string) => {
      onSearch(query);
    }, debounceMs);

    debouncedSearch(value);
  }, [value, onSearch, debounceMs]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 bg-card"
      />
    </div>
  );
}

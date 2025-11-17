/**
 * Client Filters Component
 * Filters for clients list: location (state/city)
 */

'use client';

import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Client } from '@/types';

interface ClientFiltersProps {
  clients: Client[];
  onFilterChange: (key: string, value: any) => void;
  filters: Record<string, any>;
}

export function ClientFilters({ clients, onFilterChange, filters }: ClientFiltersProps) {
  // Extract unique states and cities
  const { states, cities } = useMemo(() => {
    const statesSet = new Set<string>();
    const citiesSet = new Set<string>();

    clients.forEach(client => {
      if (client.address?.state) statesSet.add(client.address.state);
      if (client.address?.city) citiesSet.add(client.address.city);
    });

    return {
      states: Array.from(statesSet).sort(),
      cities: Array.from(citiesSet).sort(),
    };
  }, [clients]);

  return (
    <>
      {/* State Filter */}
      <Select
        value={filters.state || 'all'}
        onValueChange={(value) => onFilterChange('state', value)}
      >
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue placeholder="All States" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All States</SelectItem>
          {states.map(state => (
            <SelectItem key={state} value={state}>
              {state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* City Filter */}
      <Select
        value={filters.city || 'all'}
        onValueChange={(value) => onFilterChange('city', value)}
      >
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue placeholder="All Cities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cities</SelectItem>
          {cities.map(city => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

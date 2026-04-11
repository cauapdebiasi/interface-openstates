import { useState, useCallback } from 'react';
import { useDebouncedValue } from '@mantine/hooks';

function getInitialParam(key: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(key) || null;
}

function updateUrlParams(key: string, value: string | null) {
  const params = new URLSearchParams(window.location.search);
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
  window.history.replaceState({}, '', newUrl);
}

export function useUrlFilters() {
  const [selectedState, setSelectedStateRaw] = useState<string | null>(() => getInitialParam('jurisdiction_id'));
  const [selectedParty, setSelectedPartyRaw] = useState<string | null>(() => getInitialParam('party'));

  const setSelectedState = useCallback((val: string | null) => {
    setSelectedStateRaw(val);
    updateUrlParams('jurisdiction_id', val);
  }, []);

  const setSelectedParty = useCallback((val: string | null) => {
    setSelectedPartyRaw(val);
    updateUrlParams('party', val);
  }, []);

  const [debouncedState] = useDebouncedValue(selectedState, 300);
  const [debouncedParty] = useDebouncedValue(selectedParty, 300);

  return {
    selectedState,
    setSelectedState,
    selectedParty,
    setSelectedParty,
    debouncedState,
    debouncedParty,
  };
}

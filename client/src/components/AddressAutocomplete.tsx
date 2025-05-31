import { useState, useRef, useEffect } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface AddressAutocompleteProps {
  value?: string;
  onChange: (address: string) => void;
  onCoordinatesChange: (lat: number, lng: number) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({
  value = '',
  onChange,
  onCoordinatesChange,
  placeholder = 'Buscar dirección...',
  className = ''
}: AddressAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
    ready,
    value: searchValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Configurar según región si necesario */
    },
    debounce: 300,
  });

  // Sincronizar el valor externo con el estado interno
  useEffect(() => {
    if (value !== searchValue) {
      setValue(value, false);
    }
  }, [value, setValue, searchValue]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setValue(inputValue);
    onChange(inputValue);
    setShowSuggestions(true);
  };

  const handleSelect = async (description: string) => {
    setValue(description, false);
    onChange(description);
    setShowSuggestions(false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);
      onCoordinatesChange(lat, lng);
    } catch (error) {
      console.error('Error getting coordinates:', error);
    }
  };

  const clearInput = () => {
    setValue('', false);
    onChange('');
    setShowSuggestions(false);
    clearSuggestions();
    inputRef.current?.focus();
  };

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          value={searchValue}
          onChange={handleInput}
          disabled={!ready}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl"
          onFocus={() => setShowSuggestions(true)}
        />
        {searchValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearInput}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showSuggestions && status === 'OK' && data.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
        >
          {data.map(({ place_id, description, terms }) => (
            <button
              key={place_id}
              type="button"
              onClick={() => handleSelect(description)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {terms[0]?.value}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
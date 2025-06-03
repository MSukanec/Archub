import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface AddressAutocompleteProps {
  value?: string;
  onChange: (address: string) => void;
  onCoordinatesChange: (lat: number, lng: number) => void;
  onCityChange?: (city: string) => void;
  onZipCodeChange?: (zipCode: string) => void;
  onStateChange?: (state: string) => void;
  onCountryChange?: (country: string) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function AddressAutocomplete({
  value = '',
  onChange,
  onCoordinatesChange,
  onCityChange,
  onZipCodeChange,
  onStateChange,
  onCountryChange,
  placeholder = 'Buscar dirección...',
  className = ''
}: AddressAutocompleteProps) {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Inicializar Google Maps Autocomplete
  useEffect(() => {
    const initializeAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) {
        return;
      }

      try {
        // Crear instancia de Autocomplete
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            fields: ['formatted_address', 'geometry', 'address_components']
          }
        );

        // Escuchar evento place_changed
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (!place || !place.geometry) {
            console.warn('No se encontró información de ubicación para esta dirección');
            return;
          }

          // Obtener dirección formateada
          const formattedAddress = place.formatted_address || '';
          onChange(formattedAddress);

          // Obtener coordenadas
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          setLat(lat);
          setLng(lng);
          onCoordinatesChange(lat, lng);

          // Extraer información de address_components
          let city = '';
          let zipCode = '';
          let state = '';
          let country = '';
          
          if (place.address_components) {
            place.address_components.forEach((component: any) => {
              const types = component.types;
              
              if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                city = component.long_name;
              }
              
              if (types.includes('postal_code')) {
                zipCode = component.long_name;
              }
              
              if (types.includes('administrative_area_level_1')) {
                state = component.long_name;
              }
              
              if (types.includes('country')) {
                country = component.long_name;
              }
            });
          }

          // Llamar callbacks opcionales
          if (onCityChange && city) {
            onCityChange(city);
          }
          if (onZipCodeChange && zipCode) {
            onZipCodeChange(zipCode);
          }
          if (onStateChange && state) {
            onStateChange(state);
          }
          if (onCountryChange && country) {
            onCountryChange(country);
          }
        });

        setIsReady(true);
      } catch (error) {
        console.error('Error inicializando Google Maps Autocomplete:', error);
      }
    };

    // Verificar si Google Maps ya está cargado
    if (window.google?.maps?.places) {
      initializeAutocomplete();
    } else {
      // Esperar a que se cargue Google Maps
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogleMaps);
          initializeAutocomplete();
        }
      }, 100);

      // Limpiar intervalo después de 10 segundos
      setTimeout(() => {
        clearInterval(checkGoogleMaps);
        if (!isReady) {
          console.warn('Google Maps no se cargó correctamente');
        }
      }, 10000);

      return () => clearInterval(checkGoogleMaps);
    }
  }, [onChange, onCoordinatesChange, onCityChange, onZipCodeChange, onStateChange, onCountryChange]);

  // Actualizar valor del input cuando cambia la prop value
  useEffect(() => {
    if (inputRef.current && value !== inputRef.current.value) {
      inputRef.current.value = value;
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
  };

  const clearInput = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onChange('');
    setLat(null);
    setLng(null);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          defaultValue={value}
          onChange={handleInputChange}
          disabled={!isReady}
          placeholder={isReady ? placeholder : 'Cargando Google Maps...'}
          className="pl-10 pr-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl"
        />
        {value && (
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
    </div>
  );
}
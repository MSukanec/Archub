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

  // Función para extraer componentes de dirección
  const extractAddressComponents = (addressComponents: any[]) => {
    let city = '';
    let zipCode = '';
    let state = '';
    let country = '';
    
    console.log('Extracting from address components:', addressComponents);
    
    addressComponents.forEach((component: any) => {
      const types = component.types;
      console.log('Component:', component.long_name, 'Types:', types);
      
      // Ciudad - múltiples tipos posibles
      if (types.includes('locality')) {
        city = component.long_name;
        console.log('City found (locality):', city);
      } else if (types.includes('administrative_area_level_2') && !city) {
        city = component.long_name;
        console.log('City found (admin_area_level_2):', city);
      } else if (types.includes('sublocality') && !city) {
        city = component.long_name;
        console.log('City found (sublocality):', city);
      }
      
      // Código postal
      if (types.includes('postal_code')) {
        zipCode = component.long_name;
        console.log('Zip code found:', zipCode);
      }
      
      // Estado/Provincia
      if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
        console.log('State found:', state);
      }
      
      // País
      if (types.includes('country')) {
        country = component.long_name;
        console.log('Country found:', country);
      }
    });

    // Llamar callbacks opcionales
    console.log('Final extracted values:', { city, zipCode, state, country });
    
    if (onCityChange && city) {
      console.log('Calling onCityChange with:', city);
      onCityChange(city);
    }
    if (onZipCodeChange && zipCode) {
      console.log('Calling onZipCodeChange with:', zipCode);
      onZipCodeChange(zipCode);
    }
    if (onStateChange && state) {
      console.log('Calling onStateChange with:', state);
      onStateChange(state);
    }
    if (onCountryChange && country) {
      console.log('Calling onCountryChange with:', country);
      onCountryChange(country);
    }
  };

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
            fields: ['formatted_address', 'geometry', 'address_components', 'place_id', 'name']
          }
        );

        // Escuchar evento place_changed con mejor manejo de errores
        autocompleteRef.current.addListener('place_changed', () => {
          // Pequeño delay para asegurar que el place se haya cargado completamente
          setTimeout(() => {
            const place = autocompleteRef.current.getPlace();
            
            console.log('Place object:', place);
            
            if (!place) {
              console.warn('No place selected');
              return;
            }

            // Si no tiene geometry, intentar obtenerlo con place_id
            if (!place.geometry && place.place_id) {
              console.log('No geometry found, trying to get details for place_id:', place.place_id);
              
              try {
                const service = new window.google.maps.places.PlacesService(document.createElement('div'));
                
                service.getDetails({
                  placeId: place.place_id,
                  fields: ['formatted_address', 'geometry', 'address_components']
                }, (detailedPlace: any, status: any) => {
                  if (status === window.google.maps.places.PlacesServiceStatus.OK && detailedPlace) {
                    console.log('Got detailed place:', detailedPlace);
                    processPlace(detailedPlace);
                  } else {
                    console.warn('Failed to get place details:', status);
                  }
                });
              } catch (error) {
                console.warn('Error getting place details:', error);
              }
              return;
            }

            if (!place.geometry) {
              console.warn('No se encontró información de ubicación para esta dirección');
              return;
            }

            processPlace(place);
          }, 50);
        });

        const processPlace = (place: any) => {
          // Obtener dirección formateada
          const formattedAddress = place.formatted_address || '';
          onChange(formattedAddress);

          // Obtener coordenadas
          if (place.geometry) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setLat(lat);
            setLng(lng);
            onCoordinatesChange(lat, lng);
          }

          // Limpiar campos anteriores antes de llenar nuevos datos
          if (onCityChange) onCityChange('');
          if (onZipCodeChange) onZipCodeChange('');
          if (onStateChange) onStateChange('');
          if (onCountryChange) onCountryChange('');

          // Extraer información de address_components
          setTimeout(() => {
            extractAddressComponents(place.address_components || []);
          }, 10);
        };



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
    
    // Limpiar también los campos relacionados
    if (onCityChange) onCityChange('');
    if (onZipCodeChange) onZipCodeChange('');
    if (onStateChange) onStateChange('');
    if (onCountryChange) onCountryChange('');
    
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
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { User } from 'lucide-react';

export function OnboardingStep2() {
  const { data, updateData, nextStep, previousStep } = useOnboardingStore();

  const countries = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Ecuador', 
    'Guyana', 'Paraguay', 'Perú', 'Suriname', 'Uruguay', 'Venezuela',
    'México', 'Estados Unidos', 'Canadá', 'España', 'Otro'
  ];

  const discoveredByOptions = [
    { value: 'google', label: 'Google' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'recommended', label: 'Recomendado' },
    { value: 'other', label: 'Otro' }
  ];

  const handleNext = () => {
    // Validation
    if (!data.country.trim()) {
      alert('Por favor, selecciona tu país');
      return;
    }
    if (!data.age || data.age < 1 || data.age > 120) {
      alert('Por favor, ingresa una edad válida');
      return;
    }
    if (!data.discoveredBy) {
      alert('Por favor, indica cómo conociste Archub');
      return;
    }

    nextStep();
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <User className="w-12 h-12 mx-auto text-primary mb-2" />
        <h2 className="text-2xl font-bold text-foreground">Tu Perfil</h2>
        <p className="text-muted-foreground mt-2">
          Paso 2 de 3: Completa tu información personal
        </p>
      </div>

      <div className="space-y-6">
        {/* Country */}
        <div className="space-y-2">
          <Label>País</Label>
          <Select
            value={data.country}
            onValueChange={(value) => updateData('country', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu país" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Edad</Label>
          <Input
            id="age"
            type="number"
            min="1"
            max="120"
            value={data.age || ''}
            onChange={(e) => updateData('age', parseInt(e.target.value) || null)}
            placeholder="Ej: 30"
            className="w-full"
          />
        </div>

        {/* How did you discover us */}
        <div className="space-y-2">
          <Label>¿Cómo conociste Archub?</Label>
          <Select
            value={data.discoveredBy}
            onValueChange={(value) => updateData('discoveredBy', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              {discoveredByOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={previousStep}>
          Anterior
        </Button>
        <Button onClick={handleNext} className="px-8">
          Siguiente
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center mt-6">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
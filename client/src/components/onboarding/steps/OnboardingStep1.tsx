import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Building2, Upload, Image } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function OnboardingStep1() {
  const { data, updateData, nextStep } = useOnboardingStore();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(data.avatarUrl);

  // Fetch currencies
  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch wallets
  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch PDF templates
  const { data: pdfTemplates = [] } = useQuery({
    queryKey: ['pdf_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        updateData('avatarUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    // Validation
    if (!data.organizationName.trim()) {
      alert('Por favor, ingresa el nombre de la organización');
      return;
    }
    if (!data.defaultCurrencyId) {
      alert('Por favor, selecciona una moneda');
      return;
    }
    if (!data.defaultWalletId) {
      alert('Por favor, selecciona una billetera');
      return;
    }
    if (!data.pdfTemplateId) {
      alert('Por favor, selecciona un template PDF');
      return;
    }

    nextStep();
  };

  const predefinedAvatars = [
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=100&h=100&fit=crop&crop=face'
  ];

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <Building2 className="w-12 h-12 mx-auto text-primary mb-2" />
        <h2 className="text-2xl font-bold text-foreground">Configura tu Organización</h2>
        <p className="text-muted-foreground mt-2">
          Paso 1 de 3: Define los datos básicos de tu organización
        </p>
      </div>

      <div className="space-y-6">
        {/* Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="orgName">Nombre de la Organización</Label>
          <Input
            id="orgName"
            value={data.organizationName}
            onChange={(e) => updateData('organizationName', e.target.value)}
            placeholder="Ej: Constructora ABC"
            className="w-full"
          />
        </div>

        {/* Currency Selection */}
        <div className="space-y-2">
          <Label>Moneda Predeterminada</Label>
          <Select
            value={data.defaultCurrencyId}
            onValueChange={(value) => updateData('defaultCurrencyId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una moneda" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.id}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Wallet Selection */}
        <div className="space-y-2">
          <Label>Billetera Predeterminada</Label>
          <Select
            value={data.defaultWalletId}
            onValueChange={(value) => updateData('defaultWalletId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una billetera" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* PDF Template Selection */}
        <div className="space-y-2">
          <Label>Template PDF</Label>
          <Select
            value={data.pdfTemplateId}
            onValueChange={(value) => updateData('pdfTemplateId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un template" />
            </SelectTrigger>
            <SelectContent>
              {pdfTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Avatar Selection */}
        <div className="space-y-2">
          <Label>Avatar de la Organización</Label>
          
          {/* Current preview */}
          {avatarPreview && (
            <div className="flex justify-center mb-4">
              <img
                src={avatarPreview}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
              />
            </div>
          )}

          {/* Upload button */}
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Subir Imagen
            </Button>
          </div>

          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />

          {/* Predefined avatars */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">O elige una imagen predeterminada:</Label>
            <div className="grid grid-cols-4 gap-2">
              {predefinedAvatars.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setAvatarPreview(url);
                    updateData('avatarUrl', url);
                  }}
                  className="w-16 h-16 rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                >
                  <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <div /> {/* Spacer */}
        <Button onClick={handleNext} className="px-8">
          Siguiente
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center mt-6">
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
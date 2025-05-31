import { forwardRef } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { cn } from '@/lib/utils';

export interface PhoneInputFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

const PhoneInputField = forwardRef<HTMLInputElement, PhoneInputFieldProps>(
  ({ value, onChange, onBlur, disabled, placeholder, error, className, ...props }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <PhoneInput
          country={'ar'} // Argentina por defecto
          value={value}
          onChange={(phone) => onChange?.(phone)}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder || "Ingresa tu teléfono"}
          inputClass={cn(
            "!w-full !h-10 !pl-12 !pr-3 !py-2 !text-sm !bg-background !border !border-border !rounded-xl",
            "!text-foreground placeholder:!text-muted-foreground",
            "focus:!outline-none focus:!ring-2 focus:!ring-primary focus:!ring-offset-2 focus:!ring-offset-background",
            "disabled:!cursor-not-allowed disabled:!opacity-50",
            error && "!border-destructive focus:!ring-destructive",
            "transition-colors"
          )}
          containerClass="!w-full"
          buttonClass={cn(
            "!bg-background !border !border-border !border-r-0 !rounded-l-xl !rounded-r-none",
            "!h-10 !w-12 !flex !items-center !justify-center",
            "hover:!bg-muted !transition-colors",
            error && "!border-destructive"
          )}
          dropdownClass="!bg-background !border !border-border !rounded-xl !shadow-lg !z-50 !max-h-40 !overflow-y-auto"
          countryCodeEditable={false}
          enableSearch={true}
          searchPlaceholder="Buscar país..."
          specialLabel=""
          {...props}
        />
      </div>
    );
  }
);

PhoneInputField.displayName = 'PhoneInputField';

export { PhoneInputField };
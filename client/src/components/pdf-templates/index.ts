export { default as ModernTemplate } from './ModernTemplate';

// Exportar tipos de plantillas disponibles
export const TEMPLATE_TYPES = {
  DEFAULT: 'default',
  MODERN: 'modern',
  TECHNICAL: 'technical',
  COMPACT: 'compact'
} as const;

export type TemplateType = typeof TEMPLATE_TYPES[keyof typeof TEMPLATE_TYPES];

// Metadata de las plantillas
export const TEMPLATE_OPTIONS = [
  { value: 'default', label: 'Por Defecto' },
  { value: 'modern', label: 'Moderna (Personalizable)' },
  { value: 'technical', label: 'Técnica' },
  { value: 'compact', label: 'Compacta' }
];
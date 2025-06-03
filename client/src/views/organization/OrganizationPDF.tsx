import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Layout, 
  Settings,
  Save,
  Eye,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalAccordion } from '@/components/ui/ModernModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';
import { useAuthStore } from '@/stores/authStore';

interface PDFTemplate {
  id?: string;
  organization_id: string;
  name: string;
  
  // Header settings
  logo_url?: string;
  logo_width: number;
  logo_height: number;
  company_name_show: boolean;
  company_name_size: number;
  company_name_color: string;
  
  // Colors
  primary_color: string;
  secondary_color: string;
  text_color: string;
  background_color: string;
  
  // Typography
  font_family: string;
  title_size: number;
  subtitle_size: number;
  body_size: number;
  
  // Layout
  margin_top: number;
  margin_bottom: number;
  margin_left: number;
  margin_right: number;
  
  // Footer
  footer_text?: string;
  footer_show_page_numbers: boolean;
  footer_show_date: boolean;
  
  created_at?: string;
  updated_at?: string;
}

const defaultTemplate: Omit<PDFTemplate, 'id' | 'organization_id' | 'created_at' | 'updated_at'> = {
  name: 'Plantilla por defecto',
  logo_width: 80,
  logo_height: 60,
  company_name_show: true,
  company_name_size: 24,
  company_name_color: '#1f2937',
  primary_color: '#4f9eff',
  secondary_color: '#e5e7eb',
  text_color: '#1f2937',
  background_color: '#ffffff',
  font_family: 'Arial',
  title_size: 18,
  subtitle_size: 14,
  body_size: 12,
  margin_top: 20,
  margin_bottom: 20,
  margin_left: 20,
  margin_right: 20,
  footer_text: '',
  footer_show_page_numbers: true,
  footer_show_date: true,
};

export default function OrganizationPDF() {
  const { organizationId } = useUserContextStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [template, setTemplate] = useState<PDFTemplate>({
    ...defaultTemplate,
    organization_id: organizationId || '',
  });
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    branding: true,
    colors: false,
    typography: false,
    layout: false,
    footer: false,
  });

  // Fetch existing PDF template
  const { data: existingTemplate, isLoading } = useQuery({
    queryKey: ['pdf-template', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!organizationId,
  });

  useEffect(() => {
    if (existingTemplate) {
      setTemplate(existingTemplate);
    } else if (organizationId) {
      setTemplate(prev => ({ ...prev, organization_id: organizationId }));
    }
  }, [existingTemplate, organizationId]);

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: PDFTemplate) => {
      if (!organizationId || !user?.id) {
        throw new Error('Organización o usuario no válidos');
      }

      if (existingTemplate?.id) {
        // Update existing template
        const { data, error } = await supabase
          .from('pdf_templates')
          .update(templateData)
          .eq('id', existingTemplate.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('pdf_templates')
          .insert({
            ...templateData,
            organization_id: organizationId,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Plantilla guardada',
        description: 'La configuración del PDF ha sido guardada exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['pdf-template', organizationId] });
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al guardar la plantilla.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    saveTemplateMutation.mutate(template);
  };

  const updateTemplate = (field: keyof PDFTemplate, value: any) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = key === section ? !prev[section] : false;
      });
      return newState;
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Configuración PDF
            </h1>
            <p className="text-sm text-muted-foreground">
              Personaliza el diseño de tus reportes y documentos
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-[#e0e0e0] hover:bg-[#d0d0d0] text-[#919191] border-[#919191]/20 rounded-xl"
          >
            <Eye className="w-4 h-4 mr-2" />
            Vista Previa
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveTemplateMutation.isPending}
            className="bg-[#4f9eff] hover:bg-[#3d8bef] text-white border-[#4f9eff] rounded-xl"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveTemplateMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-4">
          {/* Branding Section */}
          <ModalAccordion
            id="branding"
            title="Marca y Logo"
            icon={ImageIcon}
            isOpen={openSections.branding}
            onToggle={() => toggleSection('branding')}
          >
            <div className="space-y-4">
              <div>
                <Label>URL del Logo</Label>
                <Input
                  placeholder="https://ejemplo.com/logo.png"
                  value={template.logo_url || ''}
                  onChange={(e) => updateTemplate('logo_url', e.target.value)}
                  className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ancho del Logo (px)</Label>
                  <Input
                    type="number"
                    value={template.logo_width}
                    onChange={(e) => updateTemplate('logo_width', parseInt(e.target.value) || 0)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Alto del Logo (px)</Label>
                  <Input
                    type="number"
                    value={template.logo_height}
                    onChange={(e) => updateTemplate('logo_height', parseInt(e.target.value) || 0)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={template.company_name_show}
                  onChange={(e) => updateTemplate('company_name_show', e.target.checked)}
                  className="rounded border-[#919191]/20"
                />
                <Label>Mostrar nombre de la empresa</Label>
              </div>

              {template.company_name_show && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tamaño del nombre (px)</Label>
                    <Input
                      type="number"
                      value={template.company_name_size}
                      onChange={(e) => updateTemplate('company_name_size', parseInt(e.target.value) || 0)}
                      className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    />
                  </div>
                  <div>
                    <Label>Color del nombre</Label>
                    <Input
                      type="color"
                      value={template.company_name_color}
                      onChange={(e) => updateTemplate('company_name_color', e.target.value)}
                      className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    />
                  </div>
                </div>
              )}
            </div>
          </ModalAccordion>

          {/* Colors Section */}
          <ModalAccordion
            id="colors"
            title="Colores"
            icon={Palette}
            isOpen={openSections.colors}
            onToggle={() => toggleSection('colors')}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Color Primario</Label>
                  <Input
                    type="color"
                    value={template.primary_color}
                    onChange={(e) => updateTemplate('primary_color', e.target.value)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Color Secundario</Label>
                  <Input
                    type="color"
                    value={template.secondary_color}
                    onChange={(e) => updateTemplate('secondary_color', e.target.value)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Color del Texto</Label>
                  <Input
                    type="color"
                    value={template.text_color}
                    onChange={(e) => updateTemplate('text_color', e.target.value)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Color de Fondo</Label>
                  <Input
                    type="color"
                    value={template.background_color}
                    onChange={(e) => updateTemplate('background_color', e.target.value)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </ModalAccordion>

          {/* Typography Section */}
          <ModalAccordion
            id="typography"
            title="Tipografía"
            icon={Type}
            isOpen={openSections.typography}
            onToggle={() => toggleSection('typography')}
          >
            <div className="space-y-4">
              <div>
                <Label>Fuente</Label>
                <Select value={template.font_family} onValueChange={(value) => updateTemplate('font_family', value)}>
                  <SelectTrigger className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times">Times New Roman</SelectItem>
                    <SelectItem value="Courier">Courier New</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tamaño Título (px)</Label>
                  <Input
                    type="number"
                    value={template.title_size}
                    onChange={(e) => updateTemplate('title_size', parseInt(e.target.value) || 0)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Tamaño Subtítulo (px)</Label>
                  <Input
                    type="number"
                    value={template.subtitle_size}
                    onChange={(e) => updateTemplate('subtitle_size', parseInt(e.target.value) || 0)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Tamaño Texto (px)</Label>
                  <Input
                    type="number"
                    value={template.body_size}
                    onChange={(e) => updateTemplate('body_size', parseInt(e.target.value) || 0)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </ModalAccordion>

          {/* Layout Section */}
          <ModalAccordion
            id="layout"
            title="Diseño y Márgenes"
            icon={Layout}
            isOpen={openSections.layout}
            onToggle={() => toggleSection('layout')}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Margen Superior (mm)</Label>
                  <Input
                    type="number"
                    value={template.margin_top}
                    onChange={(e) => updateTemplate('margin_top', parseInt(e.target.value) || 0)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Margen Inferior (mm)</Label>
                  <Input
                    type="number"
                    value={template.margin_bottom}
                    onChange={(e) => updateTemplate('margin_bottom', parseInt(e.target.value) || 0)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Margen Izquierdo (mm)</Label>
                  <Input
                    type="number"
                    value={template.margin_left}
                    onChange={(e) => updateTemplate('margin_left', parseInt(e.target.value) || 0)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Margen Derecho (mm)</Label>
                  <Input
                    type="number"
                    value={template.margin_right}
                    onChange={(e) => updateTemplate('margin_right', parseInt(e.target.value) || 0)}
                    className="h-10 bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </ModalAccordion>

          {/* Footer Section */}
          <ModalAccordion
            id="footer"
            title="Pie de Página"
            icon={Settings}
            isOpen={openSections.footer}
            onToggle={() => toggleSection('footer')}
          >
            <div className="space-y-4">
              <div>
                <Label>Texto del Pie</Label>
                <Textarea
                  placeholder="Texto personalizado para el pie de página..."
                  value={template.footer_text || ''}
                  onChange={(e) => updateTemplate('footer_text', e.target.value)}
                  className="min-h-[80px] bg-[#e1e1e1] border-[#919191]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={template.footer_show_page_numbers}
                    onChange={(e) => updateTemplate('footer_show_page_numbers', e.target.checked)}
                    className="rounded border-[#919191]/20"
                  />
                  <Label>Mostrar números de página</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={template.footer_show_date}
                    onChange={(e) => updateTemplate('footer_show_date', e.target.checked)}
                    className="rounded border-[#919191]/20"
                  />
                  <Label>Mostrar fecha de generación</Label>
                </div>
              </div>
            </div>
          </ModalAccordion>
        </div>

        {/* Preview Panel */}
        <div className="lg:sticky lg:top-6">
          <Card className="rounded-2xl shadow-md border-0 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Vista Previa (A4)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 overflow-hidden relative"
                style={{ 
                  aspectRatio: '210 / 297', // A4 ratio
                  backgroundColor: template.background_color,
                  fontFamily: template.font_family,
                  color: template.text_color,
                  fontSize: '12px',
                  minHeight: '500px'
                }}
              >
                {/* Header Preview */}
                <div 
                  className="flex items-center gap-6 mb-8 pb-4 border-b-2"
                  style={{ 
                    borderColor: template.primary_color,
                    paddingTop: `${template.margin_top / 2}px`,
                    paddingLeft: `${template.margin_left / 2}px`,
                    paddingRight: `${template.margin_right / 2}px`
                  }}
                >
                  {template.logo_url && (
                    <div 
                      className="bg-gray-200 rounded flex items-center justify-center text-sm font-bold text-gray-500"
                      style={{ 
                        width: `${template.logo_width / 2}px`, 
                        height: `${template.logo_height / 2}px`,
                        maxWidth: '80px',
                        maxHeight: '60px'
                      }}
                    >
                      LOGO
                    </div>
                  )}
                  {template.company_name_show && (
                    <div>
                      <h1 
                        style={{ 
                          fontSize: `${template.company_name_size / 1.5}px`,
                          color: template.company_name_color,
                          fontWeight: 'bold',
                          margin: 0
                        }}
                      >
                        Nombre de la Empresa
                      </h1>
                    </div>
                  )}
                </div>

                {/* Content Preview */}
                <div 
                  className="space-y-6"
                  style={{ 
                    paddingLeft: `${template.margin_left / 2}px`,
                    paddingRight: `${template.margin_right / 2}px`
                  }}
                >
                  <h2 
                    style={{ 
                      fontSize: `${template.title_size}px`,
                      color: template.primary_color,
                      fontWeight: 'bold',
                      margin: 0
                    }}
                  >
                    Título del Documento
                  </h2>
                  
                  <h3 
                    style={{ 
                      fontSize: `${template.subtitle_size}px`,
                      fontWeight: '600',
                      margin: 0
                    }}
                  >
                    Subtítulo de Sección
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>

                  <div 
                    className="p-4 rounded"
                    style={{ backgroundColor: template.secondary_color }}
                  >
                    <div className="h-3 bg-gray-300 rounded w-2/3 mb-3"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2 mb-3"></div>
                    <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                  </div>
                </div>

                {/* Footer Preview */}
                <div 
                  className="absolute bottom-0 left-0 right-0 text-sm border-t pt-3"
                  style={{ 
                    borderColor: template.secondary_color,
                    paddingBottom: `${template.margin_bottom / 2}px`,
                    paddingLeft: `${template.margin_left / 2}px`,
                    paddingRight: `${template.margin_right / 2}px`,
                    fontSize: `${template.body_size}px`
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span>{template.footer_text || 'Texto del pie de página'}</span>
                    <div className="flex gap-4 text-xs">
                      {template.footer_show_date && <span>02/06/2025</span>}
                      {template.footer_show_page_numbers && <span>Página 1</span>}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
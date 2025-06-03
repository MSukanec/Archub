import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Settings, FileText, ChevronDown, ChevronRight, Building2, User, Briefcase, FileCheck, Table, Calculator, MessageSquare, PenTool, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DefaultTemplate, ModernTemplate, TechnicalTemplate, TEMPLATE_OPTIONS, TemplateType } from '@/components/pdf-templates';

interface PDFExportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  type: 'budget' | 'materials';
}

interface PDFTemplate {
  id: string;
  organization_id: string;
  name: string;
  logo_url?: string;
  logo_width: number;
  logo_height: number;
  company_name_show: boolean;
  company_name_size: number;
  company_name_color: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  background_color: string;
  font_family: string;
  title_size: number;
  subtitle_size: number;
  body_size: number;
  margin_top: number;
  margin_bottom: number;
  margin_left: number;
  margin_right: number;
  footer_text?: string;
  footer_show_page_numbers: boolean;
  footer_show_date: boolean;
  company_address?: string;
  company_email?: string;
  company_phone?: string;
  document_number?: string;
  show_client_section?: boolean;
  show_project_section?: boolean;
  show_details_section?: boolean;
  show_signature_section?: boolean;
  signature_text?: string;
  company_info_size?: number;
  show_signature_fields?: boolean;
  show_clarification_field?: boolean;
  show_date_field?: boolean;
  signature_layout?: 'vertical' | 'horizontal';
  footer_info?: string;
  show_footer_info?: boolean;
}

export default function PDFExportPreview({ isOpen, onClose, title, data, type }: PDFExportPreviewProps) {
  const { organizationId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('default');
  const [isExporting, setIsExporting] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  // Estados de secciones
  const [sectionStates, setSectionStates] = useState({
    header: true,
    project: true,
    details: true,
    table: true,
    totals: true,
    footer: true,
    signatures: true
  });

  // Parámetros del PDF
  const [pdfParams, setPdfParams] = useState({
    projectCode: 'PRJ-001',
    projectName: 'Proyecto de Construcción',
    description: 'Descripción del proyecto o cambios realizados',
    showUnitColumn: true,
    showPriceColumn: true,
    showTaxCalculation: false,
    taxRate: 21,
    companyInfoSize: 10,
    signatureText: 'Firmas',
    showClarificationField: true,
    showDateField: true,
    footerInfo: 'Documento generado por Archub. www.archub.com',
    showFooterInfo: true
  });

  // Cargar plantilla PDF
  const { data: template, isLoading } = useQuery({
    queryKey: ['/api/pdf-template', organizationId],
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
    enabled: !!organizationId && isOpen
  });

  // Cargar organización
  const { data: organization } = useQuery({
    queryKey: ['/api/organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && isOpen
  });

  // Mutación para guardar plantilla
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('No organization ID');

      const templateData = {
        organization_id: organizationId,
        name: 'Mi Plantilla',
        show_clarification_field: pdfParams.showClarificationField,
        show_date_field: pdfParams.showDateField,
        footer_info: pdfParams.footerInfo,
        show_footer_info: pdfParams.showFooterInfo,
        signature_text: pdfParams.signatureText,
        company_info_size: pdfParams.companyInfoSize
      };

      if (template?.id) {
        const { data, error } = await supabase
          .from('pdf_templates')
          .update(templateData)
          .eq('id', template.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('pdf_templates')
          .insert(templateData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pdf-template', organizationId] });
      toast({
        title: "Plantilla guardada",
        description: "Los cambios se han guardado correctamente."
      });
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la plantilla. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  });

  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  const toggleSection = (section: keyof typeof sectionStates) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleGoToSettings = () => {
    setSection('organization');
    setView('pdf');
    onClose();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('pdf-preview-content');
      if (!element) {
        throw new Error('PDF preview content not found');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF exportado",
        description: "El documento se ha descargado correctamente."
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error al exportar",
        description: "No se pudo generar el PDF. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getGridCols = () => {
    const colCount = 1 + 
      (pdfParams.showUnitColumn ? 1 : 0) + 
      (pdfParams.showPriceColumn ? 1 : 0) + 
      1;
    return `grid-cols-${colCount}`;
  };

  const calculateTotal = () => {
    return data.reduce((total, item) => total + (item.total_price || 0), 0);
  };

  // Función para renderizar la plantilla seleccionada
  const renderSelectedTemplate = () => {
    const templateProps = {
      template,
      organization,
      pdfParams,
      sectionStates,
      data,
      type,
      getGridCols,
      calculateTotal
    };

    switch (selectedTemplate) {
      case 'modern':
        return <ModernTemplate {...templateProps} />;
      case 'technical':
        return <TechnicalTemplate {...templateProps} />;
      case 'default':
        return <DefaultTemplate {...templateProps} />;
      case 'compact':
        // Por ahora renderizar la plantilla por defecto hasta que se implemente
        return <DefaultTemplate {...templateProps} />;
      default:
        return <DefaultTemplate {...templateProps} />;
    }
  };

  // Sincronizar valores con la plantilla cargada
  useEffect(() => {
    if (template) {
      setPdfParams(prev => ({
        ...prev,
        companyInfoSize: template.company_info_size || 10,
        signatureText: template.signature_text || prev.signatureText,
        showClarificationField: template.show_clarification_field !== false,
        showDateField: template.show_date_field !== false,
        footerInfo: template.footer_info || prev.footerInfo,
        showFooterInfo: template.show_footer_info !== false
      }));
    }
  }, [template]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="bg-background p-6 rounded-lg">
          <p>Cargando plantilla PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      
      <div className="fixed inset-0 bg-background overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Vista Previa de Exportación PDF</h2>
                <p className="text-sm text-muted-foreground">Revisa el documento antes de exportar</p>
              </div>
            </div>
            
            {/* Selector de plantilla inline */}
            <div className="flex items-center space-x-3 border-l border-border pl-6">
              <span className="text-sm font-medium text-muted-foreground">Plantilla:</span>
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as TemplateType)}
                className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground min-w-[200px]"
              >
                {TEMPLATE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Options - Mostrar siempre */}
          <div className="w-1/3 border-r border-border p-6 overflow-y-auto bg-surface">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground mb-4">SECCIONES</h3>
                
                {/* Acordeones */}
                {[
                  { id: 'header' as keyof typeof sectionStates, label: 'Encabezado e Información de Empresa', enabled: sectionStates.header, icon: Building2 },
                  { id: 'project' as keyof typeof sectionStates, label: 'Detalles del Proyecto', enabled: sectionStates.project, icon: Briefcase },
                  { id: 'details' as keyof typeof sectionStates, label: 'Descripción y Detalles', enabled: sectionStates.details, icon: FileCheck },
                  { id: 'table' as keyof typeof sectionStates, label: 'Tabla de Elementos', enabled: sectionStates.table, icon: Table },
                  { id: 'totals' as keyof typeof sectionStates, label: 'Totales y Cálculos', enabled: sectionStates.totals, icon: Calculator },
                  { id: 'footer' as keyof typeof sectionStates, label: 'Información del Pie', enabled: sectionStates.footer, icon: MessageSquare },
                  { id: 'signatures' as keyof typeof sectionStates, label: 'Sección de Firmas', enabled: sectionStates.signatures, icon: PenTool }
                ].map((section) => (
                  <div key={section.id} className="border-2 border-border rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-surface-secondary cursor-pointer hover:bg-surface-hover transition-colors"
                      onClick={() => toggleAccordion(section.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <section.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{section.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={section.enabled}
                          onCheckedChange={() => toggleSection(section.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary [&>span]:data-[state=checked]:bg-white"
                        />
                        {activeAccordion === section.id ? 
                          <ChevronDown className="w-4 h-4 text-muted-foreground" /> : 
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          {/* Right Column - PDF Preview */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            <div className="flex justify-center">
              {renderSelectedTemplate()}
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-background">
          {selectedTemplate === 'modern' && (
            <Button
              type="button"
              variant="outline"
              onClick={handleGoToSettings}
              disabled={isExporting || saveTemplateMutation.isPending}
            >
              Configurar
            </Button>
          )}
          {selectedTemplate === 'modern' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => saveTemplateMutation.mutate()}
              disabled={isExporting || saveTemplateMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Plantilla
            </Button>
          )}
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting || saveTemplateMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
}
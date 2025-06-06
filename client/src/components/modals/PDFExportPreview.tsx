import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Settings, FileText, ChevronDown, ChevronRight, Building2, User, Briefcase, FileCheck, Table, Calculator, MessageSquare, PenTool, Save, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Switch } from "./components/ui/switch";
import { supabase } from '../../lib/supabase';
import { useUserContextStore } from '../../stores/userContextStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { useToast } from '../../hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DefaultTemplate, ModernTemplate, TechnicalTemplate, TEMPLATE_OPTIONS, TemplateType } from '../components/pdf-templates';

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
  const [zoomLevel, setZoomLevel] = useState(0.7);

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
    showFooterInfo: true,
    pageSize: 'A4',
    pageOrientation: 'portrait',
    customWidth: null as number | null,
    customHeight: null as number | null,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20
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
    mutationFn: async (templateData: any) => {
      if (!organizationId) throw new Error('No organization ID');

      const completeTemplateData = {
        organization_id: organizationId,
        name: 'Mi Plantilla',
        ...templateData
      };

      if (template?.id) {
        const { data, error } = await supabase
          .from('pdf_templates')
          .update(completeTemplateData)
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

      // Crear un elemento temporal sin zoom para exportación
      const exportElement = element.cloneNode(true) as HTMLElement;
      exportElement.id = 'pdf-export-temp';
      exportElement.style.transform = 'scale(1)';
      exportElement.style.transformOrigin = 'top left';
      exportElement.style.position = 'absolute';
      exportElement.style.left = '-9999px';
      exportElement.style.top = '0';
      document.body.appendChild(exportElement);

      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(exportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: exportElement.scrollWidth,
        height: exportElement.scrollHeight
      });

      // Limpiar elemento temporal
      document.body.removeChild(exportElement);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Primera página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Páginas adicionales si es necesario
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

  // Función para obtener dimensiones de página
  const getPageDimensions = () => {
    const sizes: Record<string, { width: number; height: number }> = {
      'A4': { width: 210, height: 297 },
      'A3': { width: 297, height: 420 },
      'A5': { width: 148, height: 210 },
      'Letter': { width: 216, height: 279 },
      'Legal': { width: 216, height: 356 },
      'Custom': { 
        width: pdfParams.customWidth || 210, 
        height: pdfParams.customHeight || 297 
      }
    };
    
    const dimensions = sizes[pdfParams.pageSize] || sizes['A4'];
    
    if (pdfParams.pageOrientation === 'landscape') {
      return { width: dimensions.height, height: dimensions.width };
    }
    
    return dimensions;
  };

  // Funciones de zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.3));
  };

  const handleZoomReset = () => {
    setZoomLevel(0.7);
  };

  // Función para renderizar la plantilla seleccionada
  const renderSelectedTemplate = () => {
    const pageDimensions = getPageDimensions();
    const templateProps = {
      template,
      organization,
      pdfParams,
      sectionStates,
      data,
      type,
      getGridCols,
      calculateTotal,
      zoomLevel,
      pageDimensions
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
        showFooterInfo: template.show_footer_info !== false,
        pageSize: template.page_size || 'A4',
        pageOrientation: template.page_orientation || 'portrait',
        customWidth: template.custom_width || null,
        customHeight: template.custom_height || null,
        marginTop: template.margin_top || 20,
        marginBottom: template.margin_bottom || 20,
        marginLeft: template.margin_left || 20,
        marginRight: template.margin_right || 20
      }));
    }
  }, [template]);

  const handleSaveTemplate = () => {
    const templateData = {
      page_size: pdfParams.pageSize,
      page_orientation: pdfParams.pageOrientation,
      custom_width: pdfParams.customWidth,
      custom_height: pdfParams.customHeight,
      margin_top: pdfParams.marginTop,
      margin_bottom: pdfParams.marginBottom,
      margin_left: pdfParams.marginLeft,
      margin_right: pdfParams.marginRight,
      logo_width: template?.logo_width || 120,
      company_info_size: pdfParams.companyInfoSize,
      signature_text: pdfParams.signatureText,
      show_clarification_field: pdfParams.showClarificationField,
      show_date_field: pdfParams.showDateField,
      footer_info: pdfParams.footerInfo,
      show_footer_info: pdfParams.showFooterInfo
    };
    
    saveTemplateMutation.mutate(templateData);
  };

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

            {/* Controles de zoom */}
            <div className="flex items-center space-x-2 border-l border-border pl-6">
              <span className="text-sm font-medium text-muted-foreground">Zoom:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.3}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono min-w-[45px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 1.5}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomReset}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
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
              <h3 className="text-sm font-medium text-foreground mb-4">CONFIGURACIÓN</h3>
                
                {/* Acordeón de Configuración de Página */}
                <div className="border-2 border-border rounded-lg overflow-hidden mb-4">
                  <div 
                    className="flex items-center justify-between p-3 bg-surface-secondary cursor-pointer hover:bg-surface-hover transition-colors"
                    onClick={() => toggleAccordion('page-config')}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Tamaño de Página y Márgenes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {activeAccordion === 'page-config' ? 
                        <ChevronDown className="w-4 h-4 text-muted-foreground" /> : 
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                  </div>
                  
                  {/* Contenido del acordeón de página */}
                  {activeAccordion === 'page-config' && (
                    <div className="p-4 bg-surface border-t border-border space-y-4">
                      {/* Tamaño de página */}
                      <div>
                        <label className="text-xs font-medium mb-2 block">Tamaño de Página</label>
                        <select
                          value={pdfParams.pageSize}
                          onChange={(e) => setPdfParams(prev => ({ ...prev, pageSize: e.target.value }))}
                          className="w-full p-2 text-xs border border-border rounded bg-background"
                        >
                          <option value="A4">A4 (210 × 297 mm)</option>
                          <option value="A3">A3 (297 × 420 mm)</option>
                          <option value="A5">A5 (148 × 210 mm)</option>
                          <option value="Letter">Letter (216 × 279 mm)</option>
                          <option value="Legal">Legal (216 × 356 mm)</option>
                          <option value="Custom">Personalizado</option>
                        </select>
                      </div>

                      {/* Orientación */}
                      <div>
                        <label className="text-xs font-medium mb-2 block">Orientación</label>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setPdfParams(prev => ({ ...prev, pageOrientation: 'portrait' }))}
                            className={`flex-1 p-2 text-xs border rounded ${
                              pdfParams.pageOrientation === 'portrait' 
                                ? 'bg-primary text-primary-foreground border-primary' 
                                : 'bg-background border-border'
                            }`}
                          >
                            Vertical
                          </button>
                          <button
                            type="button"
                            onClick={() => setPdfParams(prev => ({ ...prev, pageOrientation: 'landscape' }))}
                            className={`flex-1 p-2 text-xs border rounded ${
                              pdfParams.pageOrientation === 'landscape' 
                                ? 'bg-primary text-primary-foreground border-primary' 
                                : 'bg-background border-border'
                            }`}
                          >
                            Horizontal
                          </button>
                        </div>
                      </div>

                      {/* Dimensiones personalizadas */}
                      {pdfParams.pageSize === 'Custom' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium mb-1 block">Ancho (mm)</label>
                            <input
                              type="number"
                              value={pdfParams.customWidth || ''}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, customWidth: e.target.value ? Number(e.target.value) : null }))}
                              className="w-full p-2 text-xs border border-border rounded bg-background"
                              placeholder="210"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium mb-1 block">Alto (mm)</label>
                            <input
                              type="number"
                              value={pdfParams.customHeight || ''}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, customHeight: e.target.value ? Number(e.target.value) : null }))}
                              className="w-full p-2 text-xs border border-border rounded bg-background"
                              placeholder="297"
                            />
                          </div>
                        </div>
                      )}

                      {/* Márgenes */}
                      <div>
                        <label className="text-xs font-medium mb-2 block">Márgenes (mm)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Superior</label>
                            <input
                              type="number"
                              value={pdfParams.marginTop}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, marginTop: Number(e.target.value) }))}
                              className="w-full p-2 text-xs border border-border rounded bg-background"
                              min="0"
                              max="50"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Inferior</label>
                            <input
                              type="number"
                              value={pdfParams.marginBottom}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, marginBottom: Number(e.target.value) }))}
                              className="w-full p-2 text-xs border border-border rounded bg-background"
                              min="0"
                              max="50"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Izquierdo</label>
                            <input
                              type="number"
                              value={pdfParams.marginLeft}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, marginLeft: Number(e.target.value) }))}
                              className="w-full p-2 text-xs border border-border rounded bg-background"
                              min="0"
                              max="50"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Derecho</label>
                            <input
                              type="number"
                              value={pdfParams.marginRight}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, marginRight: Number(e.target.value) }))}
                              className="w-full p-2 text-xs border border-border rounded bg-background"
                              min="0"
                              max="50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-medium text-foreground mb-4">SECCIONES</h3>
                
                {/* Acordeones de secciones */}
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
                    
                    {/* Accordion Content */}
                    {activeAccordion === section.id && (
                      <div className="p-4 bg-surface border-t border-border space-y-3">
                        {section.id === 'header' && (
                          <div>
                            <label className="text-xs font-medium mb-1 block">Ancho del Logo (px)</label>
                            <input
                              type="number"
                              value={template?.logo_width || 120}
                              onChange={(e) => {
                                const newWidth = Number(e.target.value);
                                saveTemplateMutation.mutate({
                                  logo_width: newWidth,
                                  organization_id: organizationId,
                                  name: 'Mi Plantilla'
                                });
                              }}
                              className="w-full p-2 text-xs border border-border rounded bg-background"
                              min="50"
                              max="300"
                              step="10"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Ajusta el ancho del logo de la organización (la altura se ajusta automáticamente)
                            </p>
                          </div>
                        )}
                        
                        {section.id === 'project' && (
                          <>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Código del Proyecto</label>
                              <input
                                type="text"
                                value={pdfParams.projectCode}
                                onChange={(e) => setPdfParams(prev => ({ ...prev, projectCode: e.target.value }))}
                                className="w-full p-2 text-xs border border-border rounded bg-background"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Nombre del Proyecto</label>
                              <input
                                type="text"
                                value={pdfParams.projectName}
                                onChange={(e) => setPdfParams(prev => ({ ...prev, projectName: e.target.value }))}
                                className="w-full p-2 text-xs border border-border rounded bg-background"
                              />
                            </div>
                          </>
                        )}
                        
                        {section.id === 'details' && (
                          <div>
                            <label className="text-xs font-medium mb-1 block">Descripción</label>
                            <textarea
                              value={pdfParams.description}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full p-2 text-xs border border-border rounded bg-background h-20 resize-none"
                              placeholder="Descripción del proyecto o cambios realizados"
                            />
                          </div>
                        )}
                        
                        {section.id === 'table' && (
                          <>
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium">Mostrar Columna de Unidades</label>
                              <Switch
                                checked={pdfParams.showUnitColumn}
                                onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showUnitColumn: checked }))}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium">Mostrar Columna de Precios</label>
                              <Switch
                                checked={pdfParams.showPriceColumn}
                                onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showPriceColumn: checked }))}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          </>
                        )}
                        
                        {section.id === 'totals' && (
                          <>
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium">Mostrar Cálculo de Impuestos</label>
                              <Switch
                                checked={pdfParams.showTaxCalculation}
                                onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showTaxCalculation: checked }))}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                            {pdfParams.showTaxCalculation && (
                              <div>
                                <label className="text-xs font-medium mb-1 block">Tasa de Impuesto (%)</label>
                                <input
                                  type="number"
                                  value={pdfParams.taxRate}
                                  onChange={(e) => setPdfParams(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                                  className="w-full p-2 text-xs border border-border rounded bg-background"
                                  min="0"
                                  max="100"
                                />
                              </div>
                            )}
                          </>
                        )}
                        
                        {section.id === 'signatures' && (
                          <>
                            <div>
                              <label className="text-xs font-medium mb-1 block">Texto de Firma</label>
                              <input
                                type="text"
                                value={pdfParams.signatureText}
                                onChange={(e) => setPdfParams(prev => ({ ...prev, signatureText: e.target.value }))}
                                className="w-full p-2 text-xs border border-border rounded bg-background"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium">Campo de Aclaración</label>
                              <Switch
                                checked={pdfParams.showClarificationField}
                                onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showClarificationField: checked }))}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium">Campo de Fecha</label>
                              <Switch
                                checked={pdfParams.showDateField}
                                onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showDateField: checked }))}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          </>
                        )}
                        
                        {section.id === 'footer' && (
                          <>
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium">Mostrar Información del Pie</label>
                              <Switch
                                checked={pdfParams.showFooterInfo}
                                onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showFooterInfo: checked }))}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                            {pdfParams.showFooterInfo && (
                              <div>
                                <label className="text-xs font-medium mb-1 block">Texto del Pie</label>
                                <input
                                  type="text"
                                  value={pdfParams.footerInfo}
                                  onChange={(e) => setPdfParams(prev => ({ ...prev, footerInfo: e.target.value }))}
                                  className="w-full p-2 text-xs border border-border rounded bg-background"
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          {/* Right Column - PDF Preview */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Página principal */}
              <div className="relative">
                {renderSelectedTemplate()}
                
                {/* Indicador de página */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded-full text-xs">
                  Página 1
                </div>
              </div>
              
              {/* Páginas adicionales si el contenido es muy largo */}
              <div className="w-full flex justify-center">
                <div 
                  className="bg-white shadow-lg border border-gray-300 relative"
                  style={{ 
                    width: '210mm',
                    minHeight: '100px',
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top center',
                    opacity: 0.3
                  }}
                >
                  <div className="p-8 flex items-center justify-center h-full">
                    <div className="text-gray-500 text-center">
                      <div className="text-sm">Página adicional</div>
                      <div className="text-xs mt-1">(Se creará automáticamente si es necesario)</div>
                    </div>
                  </div>
                  
                  {/* Indicador de página */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-500 text-white px-3 py-1 rounded-full text-xs">
                    Página 2
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveTemplate}
            disabled={isExporting || saveTemplateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveTemplateMutation.isPending ? 'Guardando...' : 'Guardar Plantilla'}
          </Button>
          
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isExporting || saveTemplateMutation.isPending}
            >
              Cancelar
            </Button>
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
    </div>
  );
}
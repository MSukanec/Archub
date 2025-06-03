import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Eye, Settings } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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

interface Organization {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export default function PDFExportPreview({ isOpen, onClose, title, data, type }: PDFExportPreviewProps) {
  const [showCustomization, setShowCustomization] = useState(false);
  const [pdfParams, setPdfParams] = useState({
    showHeader: true,
    showClient: true,
    showProject: true,
    showDetails: true,
    showSignature: true,
    showClarificationField: true,
    showDateField: true,
    showPageNumbers: true,
    showFooterInfo: true,
    footerInfo: 'Documento generado por Archub. www.archub.com',
    signatureLayout: 'horizontal' as 'horizontal' | 'vertical'
  });

  const [sectionStates, setSectionStates] = useState({
    header: true,
    client: true,
    project: true,
    details: true,
    signature: true
  });

  const queryClient = useQueryClient();

  // Fetch PDF templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/pdf-templates'],
    enabled: isOpen
  });

  // Fetch organization data
  const { data: organization, isLoading: orgLoading } = useQuery<Organization>({
    queryKey: ['/api/organization'],
    enabled: isOpen
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const template = templates?.find((t: PDFTemplate) => t.id === selectedTemplateId);

  const isLoading = templatesLoading || orgLoading;

  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    if (template) {
      setPdfParams(prev => ({
        ...prev,
        showPageNumbers: template.footer_show_page_numbers,
        showFooterInfo: template.show_footer_info ?? true,
        footerInfo: template.footer_info || 'Documento generado por Archub. www.archub.com',
        showClarificationField: template.show_clarification_field ?? true,
        showDateField: template.show_date_field ?? true,
        signatureLayout: template.signature_layout || 'horizontal'
      }));
      
      setSectionStates({
        header: true,
        client: template.show_client_section ?? true,
        project: template.show_project_section ?? true,
        details: template.show_details_section ?? true,
        signature: template.show_signature_section ?? true
      });
    }
  }, [template]);

  const updateTemplateMutation = useMutation({
    mutationFn: async (updates: Partial<PDFTemplate>) => {
      const response = await fetch(`/api/pdf-templates/${selectedTemplateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pdf-templates'] });
      toast({ title: 'Plantilla actualizada', description: 'Los cambios se han guardado correctamente.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo actualizar la plantilla.', variant: 'destructive' });
    }
  });

  const updatePdfParam = (key: string, value: any) => {
    setPdfParams(prev => ({ ...prev, [key]: value }));
    
    // Update template in database
    const templateUpdates: any = {};
    if (key === 'showPageNumbers') templateUpdates.footer_show_page_numbers = value;
    if (key === 'showFooterInfo') templateUpdates.show_footer_info = value;
    if (key === 'footerInfo') templateUpdates.footer_info = value;
    if (key === 'showClarificationField') templateUpdates.show_clarification_field = value;
    if (key === 'showDateField') templateUpdates.show_date_field = value;
    if (key === 'signatureLayout') templateUpdates.signature_layout = value;
    
    if (Object.keys(templateUpdates).length > 0) {
      updateTemplateMutation.mutate(templateUpdates);
    }
  };

  const updateSectionState = (section: string, value: boolean) => {
    setSectionStates(prev => ({ ...prev, [section]: value }));
    
    // Update template in database
    const templateUpdates: any = {};
    if (section === 'client') templateUpdates.show_client_section = value;
    if (section === 'project') templateUpdates.show_project_section = value;
    if (section === 'details') templateUpdates.show_details_section = value;
    if (section === 'signature') templateUpdates.show_signature_section = value;
    
    updateTemplateMutation.mutate(templateUpdates);
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('pdf-preview-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 297;
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

      pdf.save(`${title}.pdf`);
      toast({ title: 'PDF exportado', description: 'El archivo se ha descargado correctamente.' });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({ title: 'Error', description: 'No se pudo exportar el PDF.', variant: 'destructive' });
    }
  };

  // Simple template renderer
  const renderSimpleTemplate = () => (
    <div 
      id="pdf-preview-content"
      className="bg-white p-8 shadow-lg border border-gray-300"
      style={{ 
        width: '210mm',
        minHeight: '297mm',
        fontFamily: 'Arial, sans-serif',
        transform: 'scale(0.7)',
        transformOrigin: 'top center'
      }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>
        <div className="text-sm text-gray-600 mb-4">
          <p>Fecha: {new Date().toLocaleDateString('es-ES')}</p>
          <p>Documento: {type === 'budget' ? 'Presupuesto' : 'Lista de Materiales'}</p>
        </div>
      </div>

      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Descripción</th>
              <th className="border border-gray-300 p-2 text-center">Cantidad</th>
              <th className="border border-gray-300 p-2 text-right">Precio</th>
              <th className="border border-gray-300 p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">{item.description || item.name}</td>
                <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                <td className="border border-gray-300 p-2 text-right">${item.price?.toFixed(2)}</td>
                <td className="border border-gray-300 p-2 text-right">${(item.quantity * item.price)?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 border-t pt-4">
        <div className="flex justify-between">
          <div>
            <div className="border-t border-gray-300 pt-2 w-48">
              <div className="text-center text-sm">Firma del Cliente</div>
            </div>
          </div>
          <div>
            <div className="border-t border-gray-300 pt-2 w-48">
              <div className="text-center text-sm">Firma de la Empresa</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Custom template renderer
  const renderCustomTemplate = () => {
    return (
      <div 
        id="pdf-preview-content"
        className="bg-white shadow-lg border border-gray-300"
        style={{ 
          width: '210mm',
          height: '297mm',
          fontFamily: template?.font_family || 'Arial',
          color: template?.text_color || '#000000',
          backgroundColor: template?.background_color || '#ffffff',
          transform: 'scale(0.7)',
          transformOrigin: 'top center',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div 
          className="text-black"
          style={{ 
            padding: `${template?.margin_top || 48}px ${template?.margin_right || 48}px ${template?.margin_bottom || 48}px ${template?.margin_left || 48}px`,
            position: 'relative',
            minHeight: 'calc(297mm - 96px)'
          }}
        >
          {/* Header */}
          {sectionStates.header && (
            <div className="mb-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-4">
                  {template?.logo_url && (
                    <img 
                      src={template.logo_url} 
                      alt="Logo" 
                      style={{ 
                        width: `${template.logo_width}px`, 
                        height: `${template.logo_height}px` 
                      }} 
                    />
                  )}
                  <div>
                    {template?.company_name_show && (
                      <h1 
                        className="font-bold"
                        style={{ 
                          fontSize: `${template?.company_name_size || 24}px`,
                          color: template?.company_name_color || '#000000'
                        }}
                      >
                        {organization?.name || 'Nombre de la Empresa'}
                      </h1>
                    )}
                    <div 
                      className="mt-2"
                      style={{ 
                        fontSize: `${template?.company_info_size || 10}px`,
                        color: template?.text_color || '#000000'
                      }}
                    >
                      <p>{organization?.address || 'Dirección de la empresa'}</p>
                      <p>{organization?.phone || 'Teléfono'} | {organization?.email || 'email@empresa.com'}</p>
                      {organization?.website && <p>{organization.website}</p>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <h2 
                    className="font-bold mb-2"
                    style={{ 
                      fontSize: `${template?.title_size || 18}px`,
                      color: template?.text_color || '#000000'
                    }}
                  >
                    ORDEN DE CAMBIO
                  </h2>
                  <div 
                    style={{ 
                      fontSize: `${template?.body_size || 11}px`,
                      color: template?.text_color || '#000000'
                    }}
                  >
                    <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                    <p><strong>N° Documento:</strong> CO-001</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Client Section */}
          {sectionStates.client && (
            <div className="mb-6">
              <h3 
                className="font-semibold mb-3"
                style={{ 
                  fontSize: `${template?.subtitle_size || 14}px`,
                  color: template?.text_color || '#000000'
                }}
              >
                INFORMACIÓN DEL CLIENTE
              </h3>
              <div 
                className="grid grid-cols-2 gap-4 p-4"
                style={{ 
                  border: '1px solid #000000',
                  fontSize: `${template?.body_size || 11}px`
                }}
              >
                <div>
                  <p><strong>Cliente:</strong> Nombre del Cliente</p>
                  <p><strong>Empresa:</strong> Empresa del Cliente</p>
                </div>
                <div>
                  <p><strong>Dirección:</strong> Dirección del cliente</p>
                  <p><strong>Teléfono:</strong> +34 600 000 000</p>
                </div>
              </div>
            </div>
          )}

          {/* Project Section */}
          {sectionStates.project && (
            <div className="mb-6">
              <h3 
                className="font-semibold mb-3"
                style={{ 
                  fontSize: `${template?.subtitle_size || 14}px`,
                  color: template?.text_color || '#000000'
                }}
              >
                INFORMACIÓN DEL PROYECTO
              </h3>
              <div 
                className="p-4"
                style={{ 
                  border: '1px solid #000000',
                  fontSize: `${template?.body_size || 11}px`
                }}
              >
                <p><strong>Proyecto:</strong> Nombre del Proyecto</p>
                <p><strong>Ubicación:</strong> Dirección del proyecto</p>
                <p><strong>Descripción:</strong> Modificación de estructura existente según planos adjuntos.</p>
              </div>
            </div>
          )}

          {/* Details Section */}
          {sectionStates.details && (
            <div className="mb-6">
              <h3 
                className="font-semibold mb-3"
                style={{ 
                  fontSize: `${template?.subtitle_size || 14}px`,
                  color: template?.text_color || '#000000'
                }}
              >
                DETALLES DE LA ORDEN DE CAMBIO
              </h3>
              <table 
                className="w-full"
                style={{ 
                  border: '1px solid #000000',
                  borderCollapse: 'collapse',
                  fontSize: `${template?.body_size || 11}px`
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'left' }}>Descripción</th>
                    <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'center' }}>Cantidad</th>
                    <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right' }}>Precio Unit.</th>
                    <th style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((item, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #000000', padding: '8px' }}>
                        {item.description || item.name || `Ítem ${index + 1}`}
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'center' }}>
                        {item.quantity || 1}
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right' }}>
                        €{(item.price || 0).toFixed(2)}
                      </td>
                      <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right' }}>
                        €{((item.quantity || 1) * (item.price || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                    <td colSpan={3} style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right' }}>
                      TOTAL:
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '8px', textAlign: 'right' }}>
                      €{data.reduce((sum, item) => sum + ((item.quantity || 1) * (item.price || 0)), 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Signature Section */}
          {sectionStates.signature && (
            <div className="mb-6">
              <h3 
                className="font-semibold mb-4"
                style={{ 
                  fontSize: `${template?.subtitle_size || 14}px`,
                  color: template?.text_color || '#000000'
                }}
              >
                FIRMAS
              </h3>
              <div 
                className={`grid gap-6 ${pdfParams.signatureLayout === 'horizontal' ? 'grid-cols-2' : 'grid-cols-1'}`}
                style={{ fontSize: `${template?.body_size || 11}px` }}
              >
                <div>
                  <div className="mb-4">
                    <div 
                      style={{ 
                        borderTop: '1px solid #000000',
                        paddingTop: '8px',
                        minHeight: '60px'
                      }}
                    >
                      <p className="text-center font-semibold">Firma del cliente</p>
                      {pdfParams.showClarificationField && (
                        <div className="mt-2">
                          <div style={{ borderBottom: '1px solid #000000', minHeight: '20px', marginBottom: '4px' }}></div>
                          <p className="text-xs">Aclaración:</p>
                        </div>
                      )}
                      {pdfParams.showDateField && (
                        <div className="mt-2">
                          <div style={{ borderBottom: '1px solid #000000', minHeight: '20px', marginBottom: '4px' }}></div>
                          <p className="text-xs">Fecha:</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <div 
                      style={{ 
                        borderTop: '1px solid #000000',
                        paddingTop: '8px',
                        minHeight: '60px'
                      }}
                    >
                      <p className="text-center font-semibold">Firma de {organization?.name || 'la empresa'}</p>
                      {pdfParams.showClarificationField && (
                        <div className="mt-2">
                          <div style={{ borderBottom: '1px solid #000000', minHeight: '20px', marginBottom: '4px' }}></div>
                          <p className="text-xs">Aclaración:</p>
                        </div>
                      )}
                      {pdfParams.showDateField && (
                        <div className="mt-2">
                          <div style={{ borderBottom: '1px solid #000000', minHeight: '20px', marginBottom: '4px' }}></div>
                          <p className="text-xs">Fecha:</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {pdfParams.showFooterInfo && pdfParams.footerInfo && (
          <div 
            style={{ 
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px',
              borderTop: '1px solid #000000',
              paddingTop: '8px',
              textAlign: 'center'
            }}
          >
            <p 
              style={{ 
                fontSize: '8px',
                color: '#666666',
                margin: '0'
              }}
            >
              {pdfParams.footerInfo}
            </p>
          </div>
        )}

        {/* Page Numbers */}
        {pdfParams.showPageNumbers && (
          <div 
            style={{ 
              position: 'absolute',
              bottom: '10px',
              right: '20px',
              fontSize: '8px',
              color: '#666666'
            }}
          >
            Página 1 de 1
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargando...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Vista previa PDF - {title}</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomization(!showCustomization)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showCustomization ? 'Ocultar' : 'Personalizar'}
              </Button>
              <Button onClick={exportToPDF} className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Descargar PDF</span>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex space-x-4">
          {showCustomization && (
            <div className="w-80 space-y-4 bg-gray-50 p-4 rounded-lg max-h-[70vh] overflow-y-auto">
              <h3 className="font-semibold">Personalización</h3>
              
              {templates && templates.length > 0 && (
                <div>
                  <Label>Plantilla</Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t: PDFTemplate) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-medium">Secciones</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-client">Cliente</Label>
                  <Switch 
                    id="show-client"
                    checked={sectionStates.client}
                    onCheckedChange={(checked) => updateSectionState('client', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-project">Proyecto</Label>
                  <Switch 
                    id="show-project"
                    checked={sectionStates.project}
                    onCheckedChange={(checked) => updateSectionState('project', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-details">Detalles</Label>
                  <Switch 
                    id="show-details"
                    checked={sectionStates.details}
                    onCheckedChange={(checked) => updateSectionState('details', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-signature">Firmas</Label>
                  <Switch 
                    id="show-signature"
                    checked={sectionStates.signature}
                    onCheckedChange={(checked) => updateSectionState('signature', checked)}
                  />
                </div>
              </div>

              {sectionStates.signature && (
                <div className="space-y-3">
                  <h4 className="font-medium">Configuración de Firmas</h4>
                  
                  <div>
                    <Label>Diseño de Firmas</Label>
                    <Select 
                      value={pdfParams.signatureLayout} 
                      onValueChange={(value) => updatePdfParam('signatureLayout', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-clarification">Campo Aclaración</Label>
                    <Switch 
                      id="show-clarification"
                      checked={pdfParams.showClarificationField}
                      onCheckedChange={(checked) => updatePdfParam('showClarificationField', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-date">Campo Fecha</Label>
                    <Switch 
                      id="show-date"
                      checked={pdfParams.showDateField}
                      onCheckedChange={(checked) => updatePdfParam('showDateField', checked)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-medium">Pie de página</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-footer-info">Mostrar información</Label>
                  <Switch 
                    id="show-footer-info"
                    checked={pdfParams.showFooterInfo}
                    onCheckedChange={(checked) => updatePdfParam('showFooterInfo', checked)}
                  />
                </div>
                
                {pdfParams.showFooterInfo && (
                  <div>
                    <Label htmlFor="footer-text">Texto del pie</Label>
                    <Textarea
                      id="footer-text"
                      value={pdfParams.footerInfo}
                      onChange={(e) => updatePdfParam('footerInfo', e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-page-numbers">Números de página</Label>
                  <Switch 
                    id="show-page-numbers"
                    checked={pdfParams.showPageNumbers}
                    onCheckedChange={(checked) => updatePdfParam('showPageNumbers', checked)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex justify-center">
            <div className="bg-gray-100 p-4 rounded-lg" style={{ minWidth: '600px' }}>
              {template ? renderCustomTemplate() : renderSimpleTemplate()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
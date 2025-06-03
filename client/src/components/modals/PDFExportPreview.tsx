import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Settings, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import ModernModal from '@/components/ui/ModernModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  // Nuevos campos para el diseño Change Order
  company_address?: string;
  company_email?: string;
  company_phone?: string;
  document_number?: string;
  show_client_section?: boolean;
  show_project_section?: boolean;
  show_details_section?: boolean;
  show_signature_section?: boolean;
  signature_text?: string;
}

export default function PDFExportPreview({ isOpen, onClose, title, data, type }: PDFExportPreviewProps) {
  const { organizationId } = useUserContextStore();
  const { setSection, setView } = useNavigationStore();
  const [isExporting, setIsExporting] = useState(false);

  // Fetch PDF template
  const { data: template, isLoading } = useQuery({
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
    enabled: !!organizationId && isOpen,
  });

  // Fetch organization
  const { data: organization } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      
      return data;
    },
    enabled: !!organizationId && isOpen,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Get the PDF preview element
      const element = document.getElementById('pdf-preview-content');
      if (!element) {
        throw new Error('PDF preview content not found');
      }

      // Convert the element to canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF with A4 dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add the first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is too long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      onClose();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDFContent = () => {
    // Generate HTML content for PDF conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body {
              font-family: ${template?.font_family || 'Arial'};
              margin: 0;
              padding: 40px;
              background: white;
              color: black;
            }
            .header {
              border-bottom: 1px solid #ccc;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: ${template?.company_name_size || 24}px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .title {
              font-size: ${template?.title_size || 18}px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #666;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .total-row {
              background-color: #f8f8f8;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${template?.company_name_show && organization?.name ? `<div class="company-name">${organization.name}</div>` : ''}
            <div class="title">${title}</div>
            <div>Fecha: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th class="text-center">Cantidad</th>
                <th class="text-center">Precio Unit.</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>
                    <div><strong>${item.name}</strong></div>
                    ${item.description ? `<div style="font-size: 12px; color: #666;">${item.description}</div>` : ''}
                  </td>
                  <td class="text-center">${item.amount} ${item.unit_name || ''}</td>
                  <td class="text-center">$${(item.unit_price || 0).toFixed(2)}</td>
                  <td class="text-right">$${(item.total_price || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" class="text-right">Total General:</td>
                <td class="text-right">$${calculateTotal().toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          ${template?.footer_text ? `
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666;">
              ${template.footer_text}
            </div>
          ` : ''}
        </body>
      </html>
    `;
    
    // Convert HTML to PDF-like content (simplified version)
    // In a real implementation, you'd use a library like jsPDF or html2pdf
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return blob;
  };

  const handleGoToSettings = () => {
    onClose();
    setSection('organization');
    setView('organization-overview');
    // Navigate to PDF configuration tab
    setTimeout(() => {
      const pdfTab = document.querySelector('[data-tab="pdf"]');
      if (pdfTab) {
        (pdfTab as HTMLElement).click();
      }
    }, 100);
  };

  const calculateTotal = () => {
    return data.reduce((total, item) => total + (item.total_price || 0), 0);
  };

  if (isLoading) {
    return (
      <ModernModal
        isOpen={isOpen}
        onClose={onClose}
        title="Vista Previa PDF"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ModernModal>
    );
  }

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title="Vista Previa de Exportación PDF"
      subtitle="Revisa el documento antes de exportar"
      icon={FileText}
      footer={
        <div className="flex gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoToSettings}
            disabled={isExporting}
            className="w-1/4 bg-transparent border-input text-foreground hover:bg-surface-secondary"
          >
            Configurar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="w-1/4 bg-transparent border-input text-foreground hover:bg-surface-secondary"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="w-2/4 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </div>
      }
    >
      {/* Vista previa del PDF con proporción A4 exacta */}
      <div className="w-full h-full overflow-auto bg-gray-100 p-6 flex justify-center">
        {/* Hoja A4 con proporciones exactas (210mm x 297mm ratio = 0.707) */}
        <div 
          id="pdf-preview-content"
          className="bg-white shadow-lg border border-gray-300"
          style={{ 
            width: '595px', // 210mm en pixels a 72 DPI
            minHeight: '842px', // 297mm en pixels a 72 DPI
            fontFamily: template?.font_family || 'Arial',
            color: template?.text_color || '#000000',
            backgroundColor: template?.background_color || '#ffffff'
          }}
        >
          {/* Contenido del PDF simulando exactamente una hoja A4 */}
          <div 
            className="text-black"
            style={{ 
              padding: `${template?.margin_top || 48}px ${template?.margin_right || 48}px ${template?.margin_bottom || 48}px ${template?.margin_left || 48}px`
            }}
          >
            {/* Header estilo Change Order */}
            <div className="mb-6">
              {/* Header superior con logo y datos de empresa */}
              <div className="flex justify-between items-start mb-6">
                {/* Logo y nombre de la empresa */}
                <div className="flex items-center space-x-4">
                  {template?.logo_url && (
                    <img 
                      src={template.logo_url} 
                      alt="Logo" 
                      className="object-contain"
                      style={{
                        width: `${template.logo_width}px`,
                        height: `${template.logo_height}px`
                      }}
                    />
                  )}
                  {template?.company_name_show && organization?.name && (
                    <div>
                      <h1 
                        className="font-bold leading-tight"
                        style={{
                          fontSize: `${template.company_name_size}px`,
                          color: template.company_name_color || '#000000'
                        }}
                      >
                        {organization.name}
                      </h1>
                    </div>
                  )}
                </div>
                
                {/* Datos de la empresa (derecha) */}
                <div className="text-right" style={{ fontSize: `${template?.body_size || 10}px`, color: template?.text_color || '#000000' }}>
                  {template?.company_address && (
                    <div className="mb-1">{template.company_address}</div>
                  )}
                  <div className="mb-1">
                    {template?.company_email && <div>Email: {template.company_email}</div>}
                    {template?.company_phone && <div>Ph: {template.company_phone}</div>}
                  </div>
                </div>
              </div>

              {/* Título del documento y metadatos */}
              <div className="flex justify-between items-center mb-6" style={{ borderBottom: `2px solid ${template?.secondary_color || '#000000'}`, paddingBottom: '8px' }}>
                <h2 
                  className="font-bold"
                  style={{
                    fontSize: `${template?.title_size || 24}px`,
                    color: template?.primary_color || '#000000'
                  }}
                >
                  CHANGE ORDER
                </h2>
                
                <div className="text-right" style={{ fontSize: `${template?.body_size || 11}px`, color: template?.text_color || '#000000' }}>
                  <div className="mb-1">Change Order #: {template?.document_number || '1'}</div>
                  <div className="mb-1">{new Date().toLocaleDateString()}</div>
                  <div>Page: 1/1</div>
                </div>
              </div>

              {/* Secciones To: y Job: */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Sección To: (Cliente) */}
                <div style={{ border: `1px solid ${template?.secondary_color || '#cccccc'}`, padding: '12px' }}>
                  <div className="font-semibold mb-2" style={{ fontSize: `${template?.subtitle_size || 12}px`, color: template?.text_color || '#000000' }}>
                    To:
                  </div>
                  <div style={{ fontSize: `${template?.body_size || 11}px`, color: template?.text_color || '#000000' }}>
                    <div>Dr Samuel Johnstone</div>
                    <div>28 Westview Drive</div>
                    <div>North Vancouver, BC</div>
                  </div>
                </div>

                {/* Sección Job: (Proyecto) */}
                <div style={{ border: `1px solid ${template?.secondary_color || '#cccccc'}`, padding: '12px' }}>
                  <div className="font-semibold mb-2" style={{ fontSize: `${template?.subtitle_size || 12}px`, color: template?.text_color || '#000000' }}>
                    Job:
                  </div>
                  <div style={{ fontSize: `${template?.body_size || 11}px`, color: template?.text_color || '#000000' }}>
                    <div>J1278 - Johnstone Family Custom Home</div>
                    <div className="mt-2">
                      <div>Start Date: ___________</div>
                      <div>Delay Days: ___0___</div>
                      <div className="text-xs italic">(Delay days are a reasonable estimate only)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección Details */}
              <div style={{ border: `1px solid ${template?.secondary_color || '#cccccc'}`, padding: '12px', marginBottom: '16px' }}>
                <div className="font-semibold mb-2" style={{ fontSize: `${template?.subtitle_size || 12}px`, color: template?.text_color || '#000000' }}>
                  Details:
                </div>
                <div style={{ fontSize: `${template?.body_size || 11}px`, color: template?.text_color || '#000000' }}>
                  New Change Order
                </div>
              </div>

              {/* Título de la tabla */}
              <div className="font-semibold mb-3" style={{ fontSize: `${template?.subtitle_size || 12}px`, color: template?.text_color || '#000000' }}>
                Tasks and costs involved:
              </div>
            </div>

            {/* Contenido del presupuesto */}
            <div className="space-y-4">
              {data.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay datos para mostrar en el {type === 'budget' ? 'presupuesto' : 'reporte'}
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse" style={{ border: `1px solid ${template?.secondary_color || '#000000'}` }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f8f8' }}>
                          <th 
                            className="px-3 py-2 text-left font-normal"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              width: '50%'
                            }}
                          >
                            Item Description
                          </th>
                          <th 
                            className="px-3 py-2 text-center font-normal"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              width: '15%'
                            }}
                          >
                            Qty Unit
                          </th>
                          <th 
                            className="px-3 py-2 text-center font-normal"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              width: '15%'
                            }}
                          >
                            Unit Price
                          </th>
                          <th 
                            className="px-3 py-2 text-right font-normal"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              width: '20%'
                            }}
                          >
                            Sub Total (Ex)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, index) => (
                          <tr key={index} style={{ backgroundColor: '#ffffff' }}>
                            <td 
                              className="px-3 py-2"
                              style={{ 
                                border: `1px solid ${template?.secondary_color || '#000000'}`,
                                color: template?.text_color || '#000000',
                                fontSize: `${template?.body_size || 11}px`
                              }}
                            >
                              {item.name}
                            </td>
                            <td 
                              className="px-3 py-2 text-center"
                              style={{ 
                                border: `1px solid ${template?.secondary_color || '#000000'}`,
                                color: template?.text_color || '#000000',
                                fontSize: `${template?.body_size || 11}px`
                              }}
                            >
                              {item.amount} {item.unit_name}
                            </td>
                            <td 
                              className="px-3 py-2 text-center"
                              style={{ 
                                border: `1px solid ${template?.secondary_color || '#000000'}`,
                                color: template?.text_color || '#000000',
                                fontSize: `${template?.body_size || 11}px`
                              }}
                            >
                              ${item.unit_price?.toFixed(2) || '0.00'}
                            </td>
                            <td 
                              className="px-3 py-2 text-right"
                              style={{ 
                                border: `1px solid ${template?.secondary_color || '#000000'}`,
                                color: template?.text_color || '#000000',
                                fontSize: `${template?.body_size || 11}px`
                              }}
                            >
                              (${item.total_price?.toFixed(2) || '0.00'})
                            </td>
                          </tr>
                        ))}
                        
                        {/* Filas de totales como en la imagen */}
                        <tr>
                          <td colSpan={3} 
                            className="px-3 py-2 text-right font-semibold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            Change Order Total (Ex):
                          </td>
                          <td 
                            className="px-3 py-2 text-right"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            (${calculateTotal().toFixed(2)})
                          </td>
                        </tr>
                        
                        <tr>
                          <td colSpan={3} 
                            className="px-3 py-2 text-right font-semibold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            Tax:
                          </td>
                          <td 
                            className="px-3 py-2 text-right"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            (${(calculateTotal() * 0.1).toFixed(2)})
                          </td>
                        </tr>
                        
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                          <td colSpan={3} 
                            className="px-3 py-2 text-right font-bold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`
                            }}
                          >
                            Change Order Total (Incl. Tax):
                          </td>
                          <td 
                            className="px-3 py-2 text-right font-bold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`
                            }}
                          >
                            (${(calculateTotal() * 1.1).toFixed(2)})
                          </td>
                        </tr>

                        {/* Espaciador */}
                        <tr>
                          <td colSpan={4} style={{ padding: '10px', border: 'none' }}></td>
                        </tr>

                        {/* Totales del contrato */}
                        <tr>
                          <td colSpan={3} 
                            className="px-3 py-2 text-right font-semibold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            Current Contract Total (Incl. Tax):
                          </td>
                          <td 
                            className="px-3 py-2 text-right"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            $444,458.26
                          </td>
                        </tr>

                        <tr>
                          <td colSpan={3} 
                            className="px-3 py-2 text-right font-semibold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            Proposed Contract Total (Incl. Tax):
                          </td>
                          <td 
                            className="px-3 py-2 text-right"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#000000'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.body_size || 11}px`,
                              backgroundColor: '#ffffff'
                            }}
                          >
                            $443,140.43
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Texto legal y sección de firmas */}
                  <div className="mt-8 space-y-4">
                    {/* Texto de aceptación */}
                    <div 
                      className="text-justify leading-relaxed"
                      style={{ 
                        fontSize: `${template?.body_size || 10}px`,
                        color: template?.text_color || '#000000'
                      }}
                    >
                      <p className="mb-3">
                        I accept this change order and authorize works described above to be undertaken. I accept that this change order will form part of the contract 
                        and agree to the adjusted contract total and any delay to the completion date as stated above.
                      </p>
                      
                      <p>
                        I also understand and accept that any increase or decrease in the price due to this change order will be due and included in either the next 
                        payment or a future payment as set out in the contract payment schedule.
                      </p>
                    </div>

                    {/* Sección de firmas del cliente */}
                    <div 
                      className="mt-6"
                      style={{ 
                        border: `1px solid ${template?.secondary_color || '#000000'}`,
                        padding: '12px',
                        backgroundColor: '#f8f8f8'
                      }}
                    >
                      <div 
                        className="font-semibold mb-3"
                        style={{ 
                          fontSize: `${template?.body_size || 11}px`,
                          color: template?.text_color || '#000000'
                        }}
                      >
                        Signed on behalf of client:
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <div 
                            className="mb-1"
                            style={{ 
                              fontSize: `${template?.body_size || 10}px`,
                              color: template?.text_color || '#000000'
                            }}
                          >
                            SIGNED: ________________________
                          </div>
                        </div>
                        <div>
                          <div 
                            className="mb-1"
                            style={{ 
                              fontSize: `${template?.body_size || 10}px`,
                              color: template?.text_color || '#000000'
                            }}
                          >
                            Name: ________________________
                          </div>
                        </div>
                        <div>
                          <div 
                            className="mb-1"
                            style={{ 
                              fontSize: `${template?.body_size || 10}px`,
                              color: template?.text_color || '#000000'
                            }}
                          >
                            Date: _____ / _____ / _____
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sección de firmas de la empresa */}
                    <div 
                      className="mt-4"
                      style={{ 
                        border: `1px solid ${template?.secondary_color || '#000000'}`,
                        padding: '12px',
                        backgroundColor: '#f8f8f8'
                      }}
                    >
                      <div 
                        className="font-semibold mb-3"
                        style={{ 
                          fontSize: `${template?.body_size || 11}px`,
                          color: template?.text_color || '#000000'
                        }}
                      >
                        Signed on behalf of {organization?.name || 'Buildact Builders'}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <div 
                            className="mb-1"
                            style={{ 
                              fontSize: `${template?.body_size || 10}px`,
                              color: template?.text_color || '#000000'
                            }}
                          >
                            SIGNED: ________________________
                          </div>
                        </div>
                        <div>
                          <div 
                            className="mb-1"
                            style={{ 
                              fontSize: `${template?.body_size || 10}px`,
                              color: template?.text_color || '#000000'
                            }}
                          >
                            Name: ________________________
                          </div>
                        </div>
                        <div>
                          <div 
                            className="mb-1"
                            style={{ 
                              fontSize: `${template?.body_size || 10}px`,
                              color: template?.text_color || '#000000'
                            }}
                          >
                            Date: _____ / _____ / _____
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModernModal>
  );
}
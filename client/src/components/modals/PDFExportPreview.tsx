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
            {/* Header del PDF */}
            <div className="mb-8 pb-4" style={{ borderBottom: `1px solid ${template?.secondary_color || '#cccccc'}` }}>
              <div className="flex items-center justify-between mb-4">
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
                  <h1 
                    className="font-bold"
                    style={{
                      fontSize: `${template.company_name_size}px`,
                      color: template.company_name_color || '#000000'
                    }}
                  >
                    {organization.name}
                  </h1>
                )}
              </div>
              <h2 
                className="font-semibold mb-2"
                style={{
                  fontSize: `${template?.title_size || 18}px`,
                  color: template?.primary_color || '#000000'
                }}
              >
                {title}
              </h2>
              <p 
                style={{
                  color: template?.text_color || '#666666',
                  fontSize: `${template?.body_size || 12}px`
                }}
              >
                Fecha: {new Date().toLocaleDateString()}
              </p>
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
                    <table className="w-full border-collapse" style={{ border: `1px solid ${template?.secondary_color || '#666666'}` }}>
                      <thead>
                        <tr style={{ backgroundColor: template?.secondary_color || '#f0f0f0' }}>
                          <th 
                            className="px-3 py-2 text-left font-semibold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#666666'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.subtitle_size || 14}px`
                            }}
                          >
                            Descripción
                          </th>
                          <th 
                            className="px-3 py-2 text-center font-semibold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#666666'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.subtitle_size || 14}px`
                            }}
                          >
                            Cantidad
                          </th>
                          <th 
                            className="px-3 py-2 text-center font-semibold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#666666'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.subtitle_size || 14}px`
                            }}
                          >
                            Precio Unit.
                          </th>
                          <th 
                            className="px-3 py-2 text-right font-semibold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#666666'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.subtitle_size || 14}px`
                            }}
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, index) => (
                          <tr key={index} style={{ backgroundColor: template?.background_color || '#ffffff' }}>
                            <td 
                              className="px-3 py-2"
                              style={{ 
                                border: `1px solid ${template?.secondary_color || '#666666'}`,
                                color: template?.text_color || '#000000'
                              }}
                            >
                              <div>
                                <div className="font-medium" style={{ fontSize: `${template?.body_size || 12}px` }}>
                                  {item.name}
                                </div>
                                {item.description && (
                                  <div 
                                    className="text-sm"
                                    style={{ 
                                      color: template?.text_color || '#666666',
                                      fontSize: `${(template?.body_size || 12) - 2}px`
                                    }}
                                  >
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td 
                              className="px-3 py-2 text-center"
                              style={{ 
                                border: `1px solid ${template?.secondary_color || '#666666'}`,
                                color: template?.text_color || '#000000',
                                fontSize: `${template?.body_size || 12}px`
                              }}
                            >
                              {item.amount} {item.unit_name}
                            </td>
                            <td 
                              className="px-3 py-2 text-center"
                              style={{ 
                                border: `1px solid ${template?.secondary_color || '#666666'}`,
                                color: template?.text_color || '#000000',
                                fontSize: `${template?.body_size || 12}px`
                              }}
                            >
                              ${item.unit_price?.toFixed(2) || '0.00'}
                            </td>
                            <td 
                              className="px-3 py-2 text-right font-medium"
                              style={{ 
                                border: `1px solid ${template?.secondary_color || '#666666'}`,
                                color: template?.text_color || '#000000',
                                fontSize: `${template?.body_size || 12}px`
                              }}
                            >
                              ${item.total_price?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: template?.primary_color || '#f8f8f8' }}>
                          <td 
                            colSpan={3} 
                            className="px-3 py-2 text-right font-bold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#666666'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.subtitle_size || 14}px`
                            }}
                          >
                            Total General:
                          </td>
                          <td 
                            className="px-3 py-2 text-right font-bold"
                            style={{ 
                              border: `1px solid ${template?.secondary_color || '#666666'}`,
                              color: template?.text_color || '#000000',
                              fontSize: `${template?.subtitle_size || 14}px`
                            }}
                          >
                            ${calculateTotal().toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Footer */}
                  {template?.footer_text && (
                    <div 
                      className="mt-8 pt-4"
                      style={{ 
                        borderTop: `1px solid ${template?.secondary_color || '#cccccc'}`,
                        color: template?.text_color || '#666666',
                        fontSize: `${template?.body_size || 12}px`
                      }}
                    >
                      {template.footer_text}
                      {template?.footer_show_date && (
                        <div className="mt-2">
                          Generado el: {new Date().toLocaleDateString()}
                        </div>
                      )}
                      {template?.footer_show_page_numbers && (
                        <div className="mt-2 text-center">
                          Página 1 de 1
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModernModal>
  );
}
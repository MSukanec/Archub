import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Settings, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
import ModernModal from '@/components/ui/ModernModal';

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
      // Generate HTML content for PDF
      const htmlBlob = generatePDFContent();
      const url = URL.createObjectURL(htmlBlob);
      
      // Create download link for HTML file (which can be printed as PDF)
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
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
          className="bg-white shadow-lg border border-gray-300"
          style={{ 
            width: '595px', // 210mm en pixels a 72 DPI
            minHeight: '842px', // 297mm en pixels a 72 DPI
            fontFamily: template?.font_family || 'Arial',
            color: '#000000'
          }}
        >
          {/* Contenido del PDF simulando exactamente una hoja A4 */}
          <div className="p-12 text-black">
            {/* Header del PDF */}
            <div className="mb-8 pb-4 border-b border-gray-300">
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
                    className="font-bold text-black"
                    style={{
                      fontSize: `${template.company_name_size}px`,
                      color: '#000000'
                    }}
                  >
                    {organization.name}
                  </h1>
                )}
              </div>
              <h2 
                className="font-semibold text-black mb-2"
                style={{
                  fontSize: `${template?.title_size || 18}px`
                }}
              >
                {title}
              </h2>
              <p className="text-gray-600 text-sm">
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
                    <table className="w-full border-collapse border border-gray-400">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-400 px-3 py-2 text-left text-black font-semibold">Descripción</th>
                          <th className="border border-gray-400 px-3 py-2 text-center text-black font-semibold">Cantidad</th>
                          <th className="border border-gray-400 px-3 py-2 text-center text-black font-semibold">Precio Unit.</th>
                          <th className="border border-gray-400 px-3 py-2 text-right text-black font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, index) => (
                          <tr key={index} className="bg-white">
                            <td className="border border-gray-400 px-3 py-2 text-black">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.description && (
                                  <div className="text-sm text-gray-600">{item.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-black">
                              {item.amount} {item.unit_name}
                            </td>
                            <td className="border border-gray-400 px-3 py-2 text-center text-black">
                              ${item.unit_price?.toFixed(2) || '0.00'}
                            </td>
                            <td className="border border-gray-400 px-3 py-2 text-right text-black font-medium">
                              ${item.total_price?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="border border-gray-400 px-3 py-2 text-right font-bold text-black">
                            Total General:
                          </td>
                          <td className="border border-gray-400 px-3 py-2 text-right font-bold text-black">
                            ${calculateTotal().toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Footer */}
                  {template?.footer_text && (
                    <div className="mt-8 pt-4 border-t border-gray-300 text-sm text-gray-600">
                      {template.footer_text}
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
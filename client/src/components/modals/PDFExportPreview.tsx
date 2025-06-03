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
      // Generate PDF content
      const pdfContent = generatePDFContent();
      
      // Create blob and download
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
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
    return `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
200
%%EOF`;
  };

  const handleGoToSettings = () => {
    onClose();
    setSection('organization');
    setView('organization-overview');
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
            className="w-1/4 bg-transparent border-input text-foreground hover:bg-surface-secondary rounded-lg"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="w-1/4 bg-transparent border-input text-foreground hover:bg-surface-secondary rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="w-2/4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
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
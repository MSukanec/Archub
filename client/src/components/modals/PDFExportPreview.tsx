import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Fetch organization data
  const { data: organization } = useQuery({
    queryKey: ['organization', organizationId],
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
    enabled: !!organizationId && isOpen,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Simular exportación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Crear un blob con el contenido PDF simulado
      const pdfContent = generatePDFContent();
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Crear enlace de descarga
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
    setView('pdf');
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
        size="xl"
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
      size="xl"
      headerActions={
        <Button
          variant="outline"
          onClick={handleGoToSettings}
          className="bg-[#e0e0e0] hover:bg-[#d0d0d0] text-[#919191] border-[#919191]/20 rounded-xl"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configurar PDF
        </Button>
      }
      footerActions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
            className="bg-[#e0e0e0] hover:bg-[#d0d0d0] text-[#919191] border-[#919191]/20 rounded-xl"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-[#4f9eff] hover:bg-[#3d8bef] text-white border-[#4f9eff] rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-hidden">
        {/* Vista previa */}
        <div className="lg:col-span-2 overflow-auto">
          <Card className="rounded-2xl shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" />
                Vista Previa del {type === 'budget' ? 'Presupuesto' : 'Reporte de Materiales'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Header del PDF */}
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  {template?.logo_url && (
                    <img 
                      src={template.logo_url} 
                      alt="Logo" 
                      className="h-12 object-contain"
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
                        color: template.company_name_color
                      }}
                    >
                      {organization.name}
                    </h1>
                  )}
                </div>
                <h2 
                  className="font-semibold"
                  style={{
                    fontSize: `${template?.title_size || 18}px`,
                    color: template?.text_color || '#1f2937'
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
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr style={{ backgroundColor: template?.secondary_color || '#e5e7eb' }}>
                            <th className="border border-gray-300 px-3 py-2 text-left">Descripción</th>
                            <th className="border border-gray-300 px-3 py-2 text-center">Cantidad</th>
                            <th className="border border-gray-300 px-3 py-2 text-center">Precio Unit.</th>
                            <th className="border border-gray-300 px-3 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((item, index) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-3 py-2">
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  {item.description && (
                                    <div className="text-sm text-gray-600">{item.description}</div>
                                  )}
                                </div>
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                {item.amount} {item.unit_name}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                ${item.unit_price?.toFixed(2) || '0.00'}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                                ${item.total_price?.toFixed(2) || '0.00'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ backgroundColor: template?.primary_color || '#4f9eff', color: 'white' }}>
                            <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right font-bold">
                              Total General:
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-right font-bold">
                              ${calculateTotal().toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Footer */}
                    {template?.footer_text && (
                      <div className="mt-6 pt-4 border-t text-sm text-gray-600">
                        {template.footer_text}
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de configuración */}
        <div className="overflow-auto">
          <Card className="rounded-2xl shadow-md border-0">
            <CardHeader>
              <CardTitle className="text-sm">Información del Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Título</label>
                <p className="text-sm">{title}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600">Tipo</label>
                <p className="text-sm capitalize">{type === 'budget' ? 'Presupuesto' : 'Materiales'}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600">Total de elementos</label>
                <p className="text-sm">{data.length}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600">Valor total</label>
                <p className="text-sm font-semibold">${calculateTotal().toFixed(2)}</p>
              </div>

              {template && (
                <div>
                  <label className="text-xs font-medium text-gray-600">Plantilla</label>
                  <p className="text-sm">{template.name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernModal>
  );
}
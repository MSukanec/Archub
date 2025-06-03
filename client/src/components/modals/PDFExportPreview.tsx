import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';

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
      // Aquí se implementaría la lógica de exportación real
      // Por ahora simularemos la exportación
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
    // Esta función generaría el contenido PDF real
    // Por ahora devolvemos un contenido simulado
    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(${title}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000208 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
295
%%EOF`;
  };

  const renderTableContent = () => {
    if (type === 'budget') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: template?.primary_color || '#4f9eff' }}>
            Cómputo y Presupuesto
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: template?.secondary_color || '#e5e7eb' }}>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Ítem</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Descripción</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">Cantidad</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">Precio Unit.</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? data.slice(0, 10).map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{index + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{item.name || item.description || 'Ítem de presupuesto'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm">{item.quantity || '1'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm">${item.price || '0.00'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm">${item.total || '0.00'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-3 py-4 text-center text-sm text-gray-500">
                      No hay datos para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: template?.primary_color || '#4f9eff' }}>
            Lista de Materiales
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: template?.secondary_color || '#e5e7eb' }}>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Material</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Categoría</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">Cantidad</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Unidad</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">Precio</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? data.slice(0, 10).map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{item.name || 'Material'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{item.category || 'Sin categoría'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm">{item.quantity || '1'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{item.unit || 'und'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm">${item.price || '0.00'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-3 py-4 text-center text-sm text-gray-500">
                      No hay datos para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] bg-white">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Vista Previa de Exportación PDF
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-hidden">
          {/* Vista previa */}
          <div className="lg:col-span-2 overflow-auto">
            <Card className="rounded-2xl shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4 text-primary" />
                  Vista Previa del Documento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="w-full border border-gray-300 rounded-lg p-6 overflow-auto"
                  style={{ 
                    aspectRatio: '210 / 297',
                    backgroundColor: template?.background_color || '#ffffff',
                    fontFamily: template?.font_family || 'Arial',
                    color: template?.text_color || '#1f2937',
                    fontSize: `${template?.body_size || 12}px`,
                    minHeight: '600px'
                  }}
                >
                  {/* Header */}
                  <div 
                    className="flex items-center gap-6 mb-6 pb-4 border-b-2"
                    style={{ 
                      borderColor: template?.primary_color || '#4f9eff',
                      paddingTop: `${(template?.margin_top || 20) / 2}px`,
                      paddingLeft: `${(template?.margin_left || 20) / 2}px`,
                      paddingRight: `${(template?.margin_right || 20) / 2}px`
                    }}
                  >
                    {template?.logo_url && (
                      <div 
                        className="bg-gray-200 rounded flex items-center justify-center text-sm font-bold text-gray-500"
                        style={{ 
                          width: `${(template.logo_width || 80) / 1.5}px`, 
                          height: `${(template.logo_height || 60) / 1.5}px`
                        }}
                      >
                        LOGO
                      </div>
                    )}
                    {template?.company_name_show && (
                      <div>
                        <h1 
                          style={{ 
                            fontSize: `${(template.company_name_size || 24) / 1.2}px`,
                            color: template.company_name_color || '#1f2937',
                            fontWeight: 'bold',
                            margin: 0
                          }}
                        >
                          {organization?.name || 'Nombre de la Empresa'}
                        </h1>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div 
                    style={{ 
                      paddingLeft: `${(template?.margin_left || 20) / 2}px`,
                      paddingRight: `${(template?.margin_right || 20) / 2}px`
                    }}
                  >
                    <h2 
                      style={{ 
                        fontSize: `${(template?.title_size || 18) * 1.2}px`,
                        color: template?.primary_color || '#4f9eff',
                        fontWeight: 'bold',
                        margin: '0 0 1rem 0'
                      }}
                    >
                      {title}
                    </h2>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        Fecha: {new Date().toLocaleDateString('es-ES')}
                      </p>
                    </div>

                    {renderTableContent()}
                  </div>

                  {/* Footer */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 text-sm border-t pt-3"
                    style={{ 
                      borderColor: template?.secondary_color || '#e5e7eb',
                      paddingBottom: `${(template?.margin_bottom || 20) / 2}px`,
                      paddingLeft: `${(template?.margin_left || 20) / 2}px`,
                      paddingRight: `${(template?.margin_right || 20) / 2}px`,
                      fontSize: `${(template?.body_size || 12) * 0.9}px`
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{template?.footer_text || 'Documento generado automáticamente'}</span>
                      <div className="flex gap-4 text-xs">
                        {template?.footer_show_date && <span>{new Date().toLocaleDateString('es-ES')}</span>}
                        {template?.footer_show_page_numbers && <span>Página 1</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel de información */}
          <div className="space-y-4">
            <Card className="rounded-2xl shadow-md border-0">
              <CardHeader>
                <CardTitle className="text-sm">Información del Documento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Tipo:</span> {type === 'budget' ? 'Cómputo y Presupuesto' : 'Lista de Materiales'}
                </div>
                <div>
                  <span className="font-medium">Elementos:</span> {data.length}
                </div>
                <div>
                  <span className="font-medium">Fecha:</span> {new Date().toLocaleDateString('es-ES')}
                </div>
                <div>
                  <span className="font-medium">Organización:</span> {organization?.name || 'Sin nombre'}
                </div>
                <div>
                  <span className="font-medium">Plantilla:</span> {template?.name || 'Plantilla por defecto'}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-[#4f9eff] hover:bg-[#3d8bef] text-white border-[#4f9eff] rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exportando...' : 'Exportar PDF'}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isExporting}
                className="bg-[#e0e0e0] hover:bg-[#d0d0d0] text-[#919191] border-[#919191]/20 rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
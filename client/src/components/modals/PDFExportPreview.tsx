import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Settings, FileText, ChevronDown, ChevronRight, Building2, User, Briefcase, FileCheck, Table, Calculator, MessageSquare, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useUserContextStore } from '@/stores/userContextStore';
import { useNavigationStore } from '@/stores/navigationStore';
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
  
  // Estados para acordeones y secciones
  const [activeAccordion, setActiveAccordion] = useState<string | null>('header');
  const [sectionStates, setSectionStates] = useState({
    header: true,
    client: true,
    project: true,
    details: true,
    table: true,
    totals: true,
    footer: true,
    signatures: true
  });

  // Estados para parámetros editables
  const [pdfParams, setPdfParams] = useState({
    clientName: 'Dr Samuel Johnstone',
    clientAddress: '28 Westview Drive\nNorth Vancouver, BC',
    projectCode: 'J1278',
    projectName: 'Johnstone Family Custom Home',
    description: 'New Change Order',
    showUnitColumn: true,
    showPriceColumn: true,
    showTaxCalculation: true,
    taxRate: 10,
    showClientSignature: true,
    showCompanySignature: true,
    showPageNumbers: true
  });

  const toggleAccordion = (accordionId: string) => {
    setActiveAccordion(activeAccordion === accordionId ? null : accordionId);
  };

  const toggleSection = (sectionId: keyof typeof sectionStates) => {
    setSectionStates(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Fetch PDF template
  const { data: template, isLoading } = useQuery({
    queryKey: ['pdf-template', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_templates')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && isOpen,
  });

  // Fetch organization
  const { data: organization } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
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
      const element = document.getElementById('pdf-preview-content');
      if (!element) {
        throw new Error('PDF preview content not found');
      }

      // Remover temporalmente el transform para captura exacta
      const originalTransform = element.style.transform;
      element.style.transform = 'none';
      element.style.width = '794px'; // A4 width in pixels at 96 DPI
      element.style.minHeight = '1123px'; // A4 height in pixels at 96 DPI

      const canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123
      });

      // Restaurar el transform original
      element.style.transform = originalTransform;
      element.style.width = '210mm';
      element.style.minHeight = '297mm';

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = 297;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);

      pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      onClose();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGoToSettings = () => {
    onClose();
    setSection('organization');
    setView('organization-overview');
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
      
      <div className="fixed inset-4 bg-background border border-border rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Vista Previa de Exportación PDF</h2>
              <p className="text-sm text-muted-foreground">Revisa el documento antes de exportar</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {/* Content - Two columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Options */}
          <div className="w-1/3 border-r border-border p-6 overflow-y-auto bg-surface">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground mb-4">SECTIONS</h3>
              
              {/* Acordeones */}
              {[
                { id: 'header' as keyof typeof sectionStates, label: 'Header & Company Info', enabled: sectionStates.header, icon: Building2 },
                { id: 'client' as keyof typeof sectionStates, label: 'Client Information', enabled: sectionStates.client, icon: User },
                { id: 'project' as keyof typeof sectionStates, label: 'Project Details', enabled: sectionStates.project, icon: Briefcase },
                { id: 'details' as keyof typeof sectionStates, label: 'Description & Details', enabled: sectionStates.details, icon: FileCheck },
                { id: 'table' as keyof typeof sectionStates, label: 'Items Table', enabled: sectionStates.table, icon: Table },
                { id: 'totals' as keyof typeof sectionStates, label: 'Totals & Calculations', enabled: sectionStates.totals, icon: Calculator },
                { id: 'footer' as keyof typeof sectionStates, label: 'Footer Information', enabled: sectionStates.footer, icon: MessageSquare },
                { id: 'signatures' as keyof typeof sectionStates, label: 'Signature Section', enabled: sectionStates.signatures, icon: PenTool }
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
                  
                  {activeAccordion === section.id && section.enabled && (
                    <div className="p-4 bg-background border-t-2 border-border">
                      {section.id === 'header' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Show Company Name</span>
                            <Switch 
                              checked={template?.company_name_show || false} 
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary [&>span]:data-[state=checked]:bg-white" 
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Company Name Size</label>
                            <input 
                              type="number" 
                              className="w-full mt-1 px-2 py-1 text-xs border rounded" 
                              defaultValue={template?.company_name_size || 24}
                            />
                          </div>
                        </div>
                      )}
                      {section.id === 'client' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium">Client Name</label>
                            <input 
                              type="text" 
                              className="w-full mt-1 px-2 py-1 text-xs border rounded" 
                              value={pdfParams.clientName}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, clientName: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Client Address</label>
                            <textarea 
                              className="w-full mt-1 px-2 py-1 text-xs border rounded" 
                              rows={3}
                              value={pdfParams.clientAddress}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, clientAddress: e.target.value }))}
                            />
                          </div>
                        </div>
                      )}
                      {section.id === 'project' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium">Project Code</label>
                            <input 
                              type="text" 
                              className="w-full mt-1 px-2 py-1 text-xs border rounded" 
                              value={pdfParams.projectCode}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, projectCode: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Project Name</label>
                            <input 
                              type="text" 
                              className="w-full mt-1 px-2 py-1 text-xs border rounded" 
                              value={pdfParams.projectName}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, projectName: e.target.value }))}
                            />
                          </div>
                        </div>
                      )}
                      {section.id === 'details' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium">Description</label>
                            <textarea 
                              className="w-full mt-1 px-2 py-1 text-xs border rounded" 
                              rows={3}
                              value={pdfParams.description}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>
                        </div>
                      )}
                      {section.id === 'table' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Show Unit Column</span>
                            <Switch 
                              checked={pdfParams.showUnitColumn}
                              onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showUnitColumn: checked }))}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary [&>span]:data-[state=checked]:bg-white" 
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Show Price Column</span>
                            <Switch 
                              checked={pdfParams.showPriceColumn}
                              onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showPriceColumn: checked }))}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary [&>span]:data-[state=checked]:bg-white" 
                            />
                          </div>
                        </div>
                      )}
                      {section.id === 'totals' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Show Tax Calculation</span>
                            <Switch 
                              checked={pdfParams.showTaxCalculation}
                              onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showTaxCalculation: checked }))}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary [&>span]:data-[state=checked]:bg-white" 
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Tax Rate (%)</label>
                            <input 
                              type="number" 
                              className="w-full mt-1 px-2 py-1 text-xs border rounded" 
                              value={pdfParams.taxRate}
                              onChange={(e) => setPdfParams(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                      )}
                      {section.id === 'footer' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium">Footer Text</label>
                            <textarea 
                              className="w-full mt-1 px-2 py-1 text-xs border rounded" 
                              rows={2}
                              defaultValue={template?.footer_text || ''}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Show Page Numbers</span>
                            <Switch 
                              checked={pdfParams.showPageNumbers}
                              onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showPageNumbers: checked }))}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary [&>span]:data-[state=checked]:bg-white" 
                            />
                          </div>
                        </div>
                      )}
                      {section.id === 'signatures' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Show Client Signature</span>
                            <Switch 
                              checked={pdfParams.showClientSignature}
                              onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showClientSignature: checked }))}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary [&>span]:data-[state=checked]:bg-white" 
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">Show Company Signature</span>
                            <Switch 
                              checked={pdfParams.showCompanySignature}
                              onCheckedChange={(checked) => setPdfParams(prev => ({ ...prev, showCompanySignature: checked }))}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary [&>span]:data-[state=checked]:bg-white" 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - PDF Preview */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            <div className="flex justify-center">
              <div 
                id="pdf-preview-content"
                className="bg-white shadow-lg border border-gray-300"
                style={{ 
                  width: '210mm', // Usar unidades exactas para consistencia
                  height: '297mm', // Altura fija A4
                  fontFamily: template?.font_family || 'Arial',
                  color: template?.text_color || '#000000',
                  backgroundColor: template?.background_color || '#ffffff',
                  transform: 'scale(0.7)', // Escalar para vista previa
                  transformOrigin: 'top center',
                  overflow: 'hidden' // Evitar contenido que se desborde
                }}
              >
                <div 
                  className="text-black"
                  style={{ 
                    padding: `${template?.margin_top || 48}px ${template?.margin_right || 48}px ${template?.margin_bottom || 48}px ${template?.margin_left || 48}px`
                  }}
                >
                  {/* Header estilo Change Order */}
                  {sectionStates.header && (
                    <div className="mb-6">
                      <div className="flex justify-between items-start mb-6">
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
                    </div>
                  )}

                  {/* Secciones To: y Job: */}
                  {(sectionStates.client || sectionStates.project) && (
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      {sectionStates.client && (
                        <div style={{ border: `1px solid ${template?.secondary_color || '#cccccc'}`, padding: '12px' }}>
                          <div className="font-semibold mb-2" style={{ fontSize: `${template?.subtitle_size || 12}px`, color: template?.text_color || '#000000' }}>
                            To:
                          </div>
                          <div style={{ fontSize: `${template?.body_size || 11}px`, color: template?.text_color || '#000000' }}>
                            {pdfParams.clientAddress.split('\n').map((line, index) => (
                              <div key={index}>{line || pdfParams.clientName}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sectionStates.project && (
                        <div style={{ border: `1px solid ${template?.secondary_color || '#cccccc'}`, padding: '12px' }}>
                          <div className="font-semibold mb-2" style={{ fontSize: `${template?.subtitle_size || 12}px`, color: template?.text_color || '#000000' }}>
                            Job:
                          </div>
                          <div style={{ fontSize: `${template?.body_size || 11}px`, color: template?.text_color || '#000000' }}>
                            <div>{pdfParams.projectCode} - {pdfParams.projectName}</div>
                            <div className="mt-2">
                              <div>Start Date: ___________</div>
                              <div>Delay Days: ___0___</div>
                              <div className="text-xs italic">(Delay days are a reasonable estimate only)</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sección Details */}
                  {sectionStates.details && (
                    <div style={{ border: `1px solid ${template?.secondary_color || '#cccccc'}`, padding: '12px', marginBottom: '16px' }}>
                      <div className="font-semibold mb-2" style={{ fontSize: `${template?.subtitle_size || 12}px`, color: template?.text_color || '#000000' }}>
                        Details:
                      </div>
                      <div style={{ fontSize: `${template?.body_size || 11}px`, color: template?.text_color || '#000000' }}>
                        {pdfParams.description}
                      </div>
                    </div>
                  )}

                  {/* Título de la tabla */}
                  {sectionStates.table && (
                    <div className="font-semibold mb-3" style={{ fontSize: `${template?.subtitle_size || 12}px`, color: template?.text_color || '#000000' }}>
                      Tasks and costs involved:
                    </div>
                  )}

                  {/* Contenido del presupuesto */}
                  <div className="space-y-4">
                    {data.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No hay datos para mostrar en el {type === 'budget' ? 'presupuesto' : 'reporte'}
                      </p>
                    ) : (
                      <>
                        {sectionStates.table && (
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
                                      width: pdfParams.showUnitColumn && pdfParams.showPriceColumn ? '50%' : '70%'
                                    }}
                                  >
                                    Item Description
                                  </th>
                                  {pdfParams.showUnitColumn && (
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
                                  )}
                                  {pdfParams.showPriceColumn && (
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
                                  )}
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
                                    {pdfParams.showUnitColumn && (
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
                                    )}
                                    {pdfParams.showPriceColumn && (
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
                                    )}
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
                                
                                {sectionStates.totals && (
                                  <>
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

                                    <tr>
                                      <td colSpan={4} style={{ padding: '10px', border: 'none' }}></td>
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
                                  </>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {sectionStates.signatures && (
                          <div className="mt-8 space-y-4">
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
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoToSettings}
            disabled={isExporting}
          >
            Configurar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
}
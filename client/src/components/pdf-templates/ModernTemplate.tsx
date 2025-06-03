import { ChevronDown, ChevronRight } from 'lucide-react';

interface ModernTemplateProps {
  template: any;
  organization: any;
  pdfParams: any;
  sectionStates: any;
  data: any[];
  type: 'budget' | 'materials';
  getGridCols: () => string;
  calculateTotal: () => number;
}

export default function ModernTemplate({
  template,
  organization,
  pdfParams,
  sectionStates,
  data,
  type,
  getGridCols,
  calculateTotal
}: ModernTemplateProps) {
  return (
    <div 
      id="pdf-preview-content"
      className="bg-white p-8 min-h-[1123px] w-[794px] mx-auto"
      style={{ 
        fontFamily: template?.font_family || 'Arial',
        fontSize: `${template?.body_size || 12}px`,
        lineHeight: '1.5',
        color: template?.text_color || '#000000',
        backgroundColor: template?.background_color || '#ffffff',
        marginTop: `${template?.margin_top || 20}px`,
        marginBottom: `${template?.margin_bottom || 20}px`,
        marginLeft: `${template?.margin_left || 20}px`,
        marginRight: `${template?.margin_right || 20}px`
      }}
    >
      {/* Header Section */}
      {sectionStates.header && (
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            {template?.logo_url && (
              <img 
                src={template.logo_url} 
                alt="Logo" 
                className="mb-3"
                style={{ 
                  width: `${template.logo_width || 80}px`, 
                  height: `${template.logo_height || 60}px`,
                  objectFit: 'contain'
                }} 
              />
            )}
            
            {template?.company_name_show && organization?.name && (
              <h1 
                className="font-bold mb-2"
                style={{ 
                  fontSize: `${template?.company_name_size || 24}px`,
                  color: template?.company_name_color || template?.primary_color || '#000000'
                }}
              >
                {organization.name}
              </h1>
            )}
            
            <div style={{ fontSize: `${template?.company_info_size || 10}px`, color: template?.text_color || '#000000' }}>
              {organization?.address && <p className="mb-1">{organization.address}</p>}
              {organization?.email && <p className="mb-1">{organization.email}</p>}
              {organization?.phone && <p className="mb-1">{organization.phone}</p>}
              {organization?.website && <p className="mb-1">{organization.website}</p>}
            </div>
          </div>
          
          <div className="text-right flex-1">
            <h2 
              className="font-bold mb-3"
              style={{ 
                fontSize: `${template?.title_size || 18}px`,
                color: template?.primary_color || '#000000'
              }}
            >
              {type === 'budget' ? 'ORDEN DE CAMBIO' : 'LISTA DE MATERIALES'}
            </h2>
            <div style={{ fontSize: `${template?.subtitle_size || 14}px` }}>
              <p className="mb-1"><strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}</p>
              <p className="mb-1"><strong>Documento #:</strong> {template?.document_number || 'DOC-001'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Project Information */}
      {sectionStates.project && (
        <div className="mb-6">
          <h3 
            className="font-bold mb-3"
            style={{ 
              fontSize: `${template?.subtitle_size || 14}px`,
              color: template?.primary_color || '#000000'
            }}
          >
            INFORMACIÓN DEL PROYECTO
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2"><strong>Cliente:</strong> {pdfParams.clientName}</p>
              <p className="mb-2"><strong>Código del Proyecto:</strong> {pdfParams.projectCode}</p>
            </div>
            <div>
              <p className="mb-2"><strong>Proyecto:</strong> {pdfParams.projectName}</p>
              <p className="mb-2"><strong>Dirección del Cliente:</strong></p>
              <div className="whitespace-pre-line text-sm">{pdfParams.clientAddress}</div>
            </div>
          </div>
        </div>
      )}

      {/* Details Section */}
      {sectionStates.details && (
        <div className="mb-6">
          <h3 
            className="font-bold mb-3"
            style={{ 
              fontSize: `${template?.subtitle_size || 14}px`,
              color: template?.primary_color || '#000000'
            }}
          >
            DETALLES
          </h3>
          <p>{pdfParams.description}</p>
        </div>
      )}

      {/* Table Section */}
      {sectionStates.table && (
        <div className="mb-6">
          <table 
            className="w-full text-sm"
            style={{ 
              borderCollapse: 'collapse',
              border: '1px solid #000000'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: template?.secondary_color || '#f0f0f0' }}>
                <th 
                  className="px-3 py-2 text-left"
                  style={{ 
                    border: '1px solid #000000',
                    color: template?.text_color || '#000000',
                    fontSize: `${template?.body_size || 11}px`,
                    width: '40%'
                  }}
                >
                  Descripción
                </th>
                {pdfParams.showUnitColumn && (
                  <th 
                    className="px-3 py-2 text-center"
                    style={{ 
                      border: '1px solid #000000',
                      color: template?.text_color || '#000000',
                      fontSize: `${template?.body_size || 11}px`,
                      width: '20%'
                    }}
                  >
                    Cantidad
                  </th>
                )}
                {pdfParams.showPriceColumn && (
                  <th 
                    className="px-3 py-2 text-center"
                    style={{ 
                      border: '1px solid #000000',
                      color: template?.text_color || '#000000',
                      fontSize: `${template?.body_size || 11}px`,
                      width: '20%'
                    }}
                  >
                    Precio Unitario
                  </th>
                )}
                <th 
                  className="px-3 py-2 text-center"
                  style={{ 
                    border: '1px solid #000000',
                    color: template?.text_color || '#000000',
                    fontSize: `${template?.body_size || 11}px`,
                    width: '20%'
                  }}
                >
                  Subtotal (Sin IVA)
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} style={{ backgroundColor: '#ffffff' }}>
                  <td 
                    className="px-3 py-2"
                    style={{ 
                      border: '1px solid #000000',
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
                        border: '1px solid #000000',
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
                        border: '1px solid #000000',
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
                      border: '1px solid #000000',
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
                    <td colSpan={pdfParams.showUnitColumn && pdfParams.showPriceColumn ? 3 : pdfParams.showUnitColumn || pdfParams.showPriceColumn ? 2 : 1} 
                      className="px-3 py-2 text-right font-semibold"
                      style={{ 
                        border: '1px solid #000000',
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
                        border: '1px solid #000000',
                        color: template?.text_color || '#000000',
                        fontSize: `${template?.body_size || 11}px`,
                        backgroundColor: '#ffffff'
                      }}
                    >
                      (${calculateTotal().toFixed(2)})
                    </td>
                  </tr>
                  
                  {pdfParams.showTaxCalculation && (
                    <tr>
                      <td colSpan={pdfParams.showUnitColumn && pdfParams.showPriceColumn ? 3 : pdfParams.showUnitColumn || pdfParams.showPriceColumn ? 2 : 1} 
                        className="px-3 py-2 text-right font-semibold"
                        style={{ 
                          border: '1px solid #000000',
                          color: template?.text_color || '#000000',
                          fontSize: `${template?.body_size || 11}px`,
                          backgroundColor: '#ffffff'
                        }}
                      >
                        IVA ({pdfParams.taxRate}%):
                      </td>
                      <td 
                        className="px-3 py-2 text-right"
                        style={{ 
                          border: '1px solid #000000',
                          color: template?.text_color || '#000000',
                          fontSize: `${template?.body_size || 11}px`,
                          backgroundColor: '#ffffff'
                        }}
                      >
                        ${(calculateTotal() * pdfParams.taxRate / 100).toFixed(2)}
                      </td>
                    </tr>
                  )}
                  
                  <tr>
                    <td colSpan={pdfParams.showUnitColumn && pdfParams.showPriceColumn ? 3 : pdfParams.showUnitColumn || pdfParams.showPriceColumn ? 2 : 1} 
                      className="px-3 py-2 text-right font-bold"
                      style={{ 
                        border: '1px solid #000000',
                        color: template?.text_color || '#000000',
                        fontSize: `${template?.body_size || 11}px`,
                        backgroundColor: template?.secondary_color || '#f0f0f0'
                      }}
                    >
                      Nuevo Total del Contrato:
                    </td>
                    <td 
                      className="px-3 py-2 text-right font-bold"
                      style={{ 
                        border: '1px solid #000000',
                        color: template?.text_color || '#000000',
                        fontSize: `${template?.body_size || 11}px`,
                        backgroundColor: template?.secondary_color || '#f0f0f0'
                      }}
                    >
                      ${pdfParams.showTaxCalculation ? 
                        (calculateTotal() + (calculateTotal() * pdfParams.taxRate / 100)).toFixed(2) : 
                        calculateTotal().toFixed(2)
                      }
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Signatures Section */}
      {sectionStates.signatures && (
        <>
          <div 
            className="mb-4"
            style={{ 
              fontSize: `${template?.body_size || 12}px`,
              color: template?.text_color || '#000000'
            }}
          >
            <p className="mb-3">
              {pdfParams.signatureText}
            </p>
          </div>

          <div 
            className="mt-6"
            style={{ 
              border: '1px solid #000000',
              padding: '12px'
            }}
          >
            {/* Layout horizontal - firmas lado a lado */}
            <div className="grid grid-cols-2 gap-8">
              {/* Firma del cliente */}
              <div>
                <div 
                  className="font-semibold mb-3"
                  style={{ 
                    fontSize: `${template?.body_size || 11}px`,
                    color: template?.text_color || '#000000'
                  }}
                >
                  Firma del cliente:
                </div>
                <div className="space-y-2">
                  <div 
                    style={{ 
                      fontSize: `${template?.body_size || 10}px`,
                      color: template?.text_color || '#000000'
                    }}
                  >
                    Firma: ________________________
                  </div>
                  {pdfParams.showClarificationField && (
                    <div 
                      style={{ 
                        fontSize: `${template?.body_size || 10}px`,
                        color: template?.text_color || '#000000'
                      }}
                    >
                      Aclaración: ________________________
                    </div>
                  )}
                  {pdfParams.showDateField && (
                    <div 
                      style={{ 
                        fontSize: `${template?.body_size || 10}px`,
                        color: template?.text_color || '#000000'
                      }}
                    >
                      Fecha: _____ / _____ / _____
                    </div>
                  )}
                </div>
              </div>

              {/* Firma de la empresa */}
              <div>
                <div 
                  className="font-semibold mb-3"
                  style={{ 
                    fontSize: `${template?.body_size || 11}px`,
                    color: template?.text_color || '#000000'
                  }}
                >
                  Firma de {organization?.name || 'Empresa'}:
                </div>
                <div className="space-y-2">
                  <div 
                    style={{ 
                      fontSize: `${template?.body_size || 10}px`,
                      color: template?.text_color || '#000000'
                    }}
                  >
                    Firma: ________________________
                  </div>
                  {pdfParams.showClarificationField && (
                    <div 
                      style={{ 
                        fontSize: `${template?.body_size || 10}px`,
                        color: template?.text_color || '#000000'
                      }}
                    >
                      Aclaración: ________________________
                    </div>
                  )}
                  {pdfParams.showDateField && (
                    <div 
                      style={{ 
                        fontSize: `${template?.body_size || 10}px`,
                        color: template?.text_color || '#000000'
                      }}
                    >
                      Fecha: _____ / _____ / _____
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer del documento */}
          {pdfParams.showFooterInfo && pdfParams.footerInfo && (
            <div 
              className="mt-8 pt-4"
              style={{ 
                borderTop: '1px solid #000000',
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
        </>
      )}
    </div>
  );
}
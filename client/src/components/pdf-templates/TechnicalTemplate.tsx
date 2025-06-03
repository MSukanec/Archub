interface TechnicalTemplateProps {
  template: any;
  organization: any;
  pdfParams: any;
  sectionStates: any;
  data: any[];
  type: 'budget' | 'materials';
  getGridCols: () => string;
  calculateTotal: () => number;
  zoomLevel: number;
  pageDimensions: { width: number; height: number };
}

export default function TechnicalTemplate({
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
}: TechnicalTemplateProps) {
  return (
    <div 
      id="pdf-preview-content"
      className="bg-white shadow-lg border border-gray-300"
      style={{ 
        width: `${pageDimensions.width}mm`,
        minHeight: `${pageDimensions.height}mm`,
        fontFamily: 'Arial',
        color: '#000000',
        backgroundColor: '#ffffff',
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top center',
        overflow: 'visible'
      }}
    >
      <div 
        className="text-black" 
        style={{ 
          padding: `${pdfParams.marginTop}mm ${pdfParams.marginRight}mm ${pdfParams.marginBottom}mm ${pdfParams.marginLeft}mm` 
        }}
      >
        {/* Header con estilo técnico */}
        {sectionStates.header && (
          <>
            <div className="flex justify-between items-start mb-8">
              {/* Logo y nombre de empresa */}
              <div className="flex items-center space-x-4">
                {organization?.logo_url && (
                  <img 
                    src={organization.logo_url} 
                    alt="Logo de la organización" 
                    style={{ 
                      width: `${template?.logo_width || 120}px`,
                      height: 'auto',
                      objectFit: 'contain'
                    }} 
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold mb-2" style={{ color: '#000000' }}>
                    {organization?.name || 'EMPRESA'}
                  </h1>
                  <div className="text-xs text-gray-600 leading-tight">
                    {organization?.address && (
                      <div>{organization.address}</div>
                    )}
                    {organization?.email && (
                      <div>{organization.email}</div>
                    )}
                    {organization?.phone && (
                      <div>{organization.phone}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Título del documento */}
              <div className="text-right">
                <h2 className="text-2xl font-bold" style={{ color: '#DC2626' }}>
                  {type === 'budget' ? 'PRESUPUESTO' : 'REPORTE'}
                </h2>
              </div>
            </div>

            {/* Línea separadora */}
            <div className="border-b-2 border-black mb-6"></div>
          </>
        )}

        {/* Información del proyecto y detalles en grid */}
        {sectionStates.project && (
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-bold mb-3 bg-gray-100 p-2">DATOS DEL PROYECTO</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Código:</span> {pdfParams.projectCode}</div>
                <div><span className="font-medium">Nombre:</span> {pdfParams.projectName}</div>
                <div><span className="font-medium">Fecha:</span> {new Date().toLocaleDateString('es-ES')}</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold mb-3 bg-gray-100 p-2">INFORMACIÓN TÉCNICA</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Documento N°:</span> DOC-{Date.now().toString().slice(-6)}</div>
                <div><span className="font-medium">Estado:</span> En revisión</div>
                <div><span className="font-medium">Versión:</span> 1.0</div>
              </div>
            </div>
          </div>
        )}

        {/* Descripción del proyecto */}
        {sectionStates.details && pdfParams.description && (
          <div className="mb-8">
            <h3 className="text-sm font-bold mb-3 bg-gray-100 p-2">DESCRIPCIÓN DEL PROYECTO</h3>
            <div className="p-4 border border-gray-300 bg-gray-50">
              <p className="text-sm leading-relaxed">{pdfParams.description}</p>
            </div>
          </div>
        )}

        {/* Tabla técnica */}
        {sectionStates.table && (
          <div className="mb-8">
            <h3 className="text-sm font-bold mb-3 bg-gray-100 p-2">
              {type === 'budget' ? 'DESGLOSE DE PRESUPUESTO' : 'DETALLE DE MATERIALES'}
            </h3>
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 p-2 font-bold text-left">ITEM</th>
                  <th className="border border-gray-400 p-2 font-bold text-left">DESCRIPCIÓN</th>
                  {pdfParams.showUnitColumn && (
                    <th className="border border-gray-400 p-2 font-bold text-center">UNIDAD</th>
                  )}
                  <th className="border border-gray-400 p-2 font-bold text-center">CANTIDAD</th>
                  {pdfParams.showPriceColumn && (
                    <>
                      <th className="border border-gray-400 p-2 font-bold text-right">PRECIO UNIT.</th>
                      <th className="border border-gray-400 p-2 font-bold text-right">TOTAL</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-400 p-2 font-mono">{String(index + 1).padStart(3, '0')}</td>
                    <td className="border border-gray-400 p-2">{item.name || item.description}</td>
                    {pdfParams.showUnitColumn && (
                      <td className="border border-gray-400 p-2 text-center">{item.unit || 'UN'}</td>
                    )}
                    <td className="border border-gray-400 p-2 text-center">{item.quantity || 1}</td>
                    {pdfParams.showPriceColumn && (
                      <>
                        <td className="border border-gray-400 p-2 text-right">
                          ${(item.unit_price || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="border border-gray-400 p-2 text-right font-bold">
                          ${(item.total_price || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totales técnicos */}
        {sectionStates.totals && pdfParams.showPriceColumn && (
          <div className="mb-8">
            <div className="flex justify-end">
              <div className="w-80">
                <table className="w-full border-collapse border border-gray-400 text-sm">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 p-3 font-bold bg-gray-100">SUBTOTAL:</td>
                      <td className="border border-gray-400 p-3 text-right">
                        ${calculateTotal().toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {pdfParams.showTaxCalculation && (
                      <>
                        <tr>
                          <td className="border border-gray-400 p-3 font-bold bg-gray-100">
                            IVA ({pdfParams.taxRate}%):
                          </td>
                          <td className="border border-gray-400 p-3 text-right">
                            ${(calculateTotal() * pdfParams.taxRate / 100).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="bg-red-600 text-white">
                          <td className="border border-gray-400 p-3 font-bold">TOTAL FINAL:</td>
                          <td className="border border-gray-400 p-3 text-right font-bold">
                            ${(calculateTotal() * (1 + pdfParams.taxRate / 100)).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </>
                    )}
                    {!pdfParams.showTaxCalculation && (
                      <tr className="bg-red-600 text-white">
                        <td className="border border-gray-400 p-3 font-bold">TOTAL:</td>
                        <td className="border border-gray-400 p-3 text-right font-bold">
                          ${calculateTotal().toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sección de firmas técnicas */}
        {sectionStates.signatures && (
          <div className="mb-8">
            <h3 className="text-sm font-bold mb-4 bg-gray-100 p-2">APROBACIONES Y FIRMAS</h3>
            <div className="grid grid-cols-3 gap-8 text-sm">
              <div className="text-center">
                <div className="border-b border-gray-400 mb-2 h-16"></div>
                <div className="font-bold">PREPARADO POR</div>
                <div className="text-xs text-gray-600">Nombre y firma</div>
                {pdfParams.showDateField && (
                  <div className="text-xs mt-1">Fecha: _____________</div>
                )}
              </div>
              
              <div className="text-center">
                <div className="border-b border-gray-400 mb-2 h-16"></div>
                <div className="font-bold">REVISADO POR</div>
                <div className="text-xs text-gray-600">Supervisor técnico</div>
                {pdfParams.showDateField && (
                  <div className="text-xs mt-1">Fecha: _____________</div>
                )}
              </div>
              
              <div className="text-center">
                <div className="border-b border-gray-400 mb-2 h-16"></div>
                <div className="font-bold">APROBADO POR</div>
                <div className="text-xs text-gray-600">Director del proyecto</div>
                {pdfParams.showDateField && (
                  <div className="text-xs mt-1">Fecha: _____________</div>
                )}
              </div>
            </div>
            
            {pdfParams.showClarificationField && (
              <div className="mt-6 p-4 border border-gray-300 bg-yellow-50">
                <div className="font-bold text-sm mb-2">OBSERVACIONES TÉCNICAS:</div>
                <div className="text-xs leading-relaxed">
                  _________________________________________________________________<br/>
                  _________________________________________________________________<br/>
                  _________________________________________________________________
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer técnico */}
        {sectionStates.footer && pdfParams.showFooterInfo && pdfParams.footerInfo && (
          <div className="mt-6 pt-4 border-t border-gray-300 text-center">
            <p className="text-xs text-gray-500">
              {pdfParams.footerInfo}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
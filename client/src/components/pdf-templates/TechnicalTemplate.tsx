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
            <div className="w-full text-xs">
              {/* Header de la tabla */}
              <div className="flex border-b-2 border-black pb-2 mb-2 font-bold">
                <div className="w-8 text-left">#</div>
                <div className="flex-1 text-left">Desc. of Goods/Services</div>
                <div className="w-16 text-center">Qty.</div>
                {pdfParams.showPriceColumn && (
                  <>
                    <div className="w-20 text-right">Rate (₹)</div>
                    <div className="w-16 text-center">Dis.</div>
                    <div className="w-16 text-center">CGST</div>
                    <div className="w-16 text-center">SGST</div>
                    <div className="w-20 text-right">Total (₹)</div>
                  </>
                )}
              </div>
              
              {/* Filas de datos */}
              {data.map((item, index) => (
                <div key={item.id || index} className="flex border-b border-gray-300 py-2">
                  <div className="w-8 text-left">{index + 1}</div>
                  <div className="flex-1 text-left">{item.name || item.description}</div>
                  <div className="w-16 text-center">{item.quantity || 1} {pdfParams.showUnitColumn ? (item.unit || 'U') : 'U'}</div>
                  {pdfParams.showPriceColumn && (
                    <>
                      <div className="w-20 text-right">
                        {(item.unit_price || 0).toLocaleString('es-ES', { minimumFractionDigits: 0 })}
                      </div>
                      <div className="w-16 text-center">0</div>
                      <div className="w-16 text-center">9</div>
                      <div className="w-16 text-center">9</div>
                      <div className="w-20 text-right">
                        {(item.total_price || 0).toLocaleString('es-ES', { minimumFractionDigits: 0 })}
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {/* Línea final */}
              <div className="border-b-2 border-black mt-4"></div>
            </div>
          </div>
        )}

        {/* Sección de método de pago y totales */}
        {sectionStates.totals && pdfParams.showPriceColumn && (
          <div className="mb-8">
            <div className="flex justify-between">
              {/* Método de pago */}
              <div className="w-1/2">
                <div className="text-xs">
                  <div className="font-bold mb-2">Payment Method</div>
                  <div>Cash</div>
                  
                  <div className="font-bold mt-4 mb-2">In Words</div>
                  <div>
                    {(() => {
                      const total = pdfParams.showTaxCalculation 
                        ? calculateTotal() * (1 + pdfParams.taxRate / 100)
                        : calculateTotal();
                      return total > 100000 
                        ? `${Math.floor(total / 100000)} Lakh ${Math.floor((total % 100000) / 1000)} Thousand Rupees Only`
                        : `${Math.floor(total / 1000)} Thousand Rupees Only`;
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Totales */}
              <div className="w-1/2">
                <div className="text-xs space-y-1">
                  <div className="flex justify-between border-b border-gray-300 pb-1">
                    <span>Sub Total</span>
                    <span>{calculateTotal().toLocaleString('es-ES', { minimumFractionDigits: 0 })}</span>
                  </div>
                  
                  {pdfParams.showTaxCalculation && (
                    <>
                      <div className="flex justify-between border-b border-gray-300 pb-1">
                        <span>CGST</span>
                        <span>{(calculateTotal() * (pdfParams.taxRate / 2) / 100).toLocaleString('es-ES', { minimumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-300 pb-1">
                        <span>SGST</span>
                        <span>{(calculateTotal() * (pdfParams.taxRate / 2) / 100).toLocaleString('es-ES', { minimumFractionDigits: 0 })}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between border-b-2 border-black pt-2 pb-1 font-bold">
                    <span>Total</span>
                    <span>
                      {pdfParams.showTaxCalculation 
                        ? (calculateTotal() * (1 + pdfParams.taxRate / 100)).toLocaleString('es-ES', { minimumFractionDigits: 0 })
                        : calculateTotal().toLocaleString('es-ES', { minimumFractionDigits: 0 })
                      }
                    </span>
                  </div>
                </div>
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
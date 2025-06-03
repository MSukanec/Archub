interface TechnicalTemplateProps {
  template: any;
  organization: any;
  pdfParams: any;
  sectionStates: any;
  data: any[];
  type: 'budget' | 'materials';
  getGridCols: () => string;
  calculateTotal: () => number;
}

export default function TechnicalTemplate({
  template,
  organization,
  pdfParams,
  sectionStates,
  data,
  type,
  getGridCols,
  calculateTotal
}: TechnicalTemplateProps) {
  return (
    <div 
      id="pdf-preview-content"
      className="bg-white shadow-lg border border-gray-300"
      style={{ 
        width: '210mm',
        height: '297mm',
        fontFamily: 'Arial',
        color: '#000000',
        backgroundColor: '#ffffff',
        transform: 'scale(0.7)',
        transformOrigin: 'top center',
        overflow: 'hidden'
      }}
    >
      <div className="text-black" style={{ padding: '20px' }}>
        {/* Header con estilo técnico */}
        <div className="flex justify-between items-start mb-8">
          {/* Logo y nombre de empresa */}
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

          {/* Título del documento */}
          <div className="text-right">
            <h2 className="text-2xl font-bold" style={{ color: '#DC2626' }}>
              {type === 'budget' ? 'PRESUPUESTO' : 'REPORTE'}
            </h2>
          </div>
        </div>

        {/* Línea separadora */}
        <div className="border-b-2 border-black mb-6"></div>

        {/* Información del proyecto y detalles en grid */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          {/* Columna izquierda */}
          <div>
            <div className="mb-4">
              <div className="text-xs font-semibold mb-1">Proyecto</div>
              <div className="text-sm">{pdfParams.projectCode}</div>
              <div className="text-sm">{pdfParams.projectName}</div>
            </div>
            
            <div className="mb-4">
              <div className="text-xs font-semibold mb-1">Monto Debido</div>
              <div className="text-sm font-bold">${calculateTotal().toFixed(2)}</div>
            </div>
          </div>

          {/* Columna derecha */}
          <div>
            <div className="mb-4">
              <div className="text-xs font-semibold mb-1">Contacto</div>
              <div className="text-sm">{organization?.website || 'www.empresa.com'}</div>
              <div className="text-sm">{organization?.phone || 'Teléfono'}</div>
              <div className="text-sm">{organization?.email || 'Email'}</div>
            </div>
            
            <div className="mb-4">
              <div className="text-xs font-semibold mb-1">Fecha de Vencimiento</div>
              <div className="text-sm">{new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Segunda línea separadora */}
        <div className="border-b border-gray-300 mb-6"></div>

        {/* Información adicional en grid */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <div className="text-xs font-semibold mb-1">Presupuesto Para</div>
            <div className="text-sm">Cliente</div>
            <div className="text-sm">Dirección del Proyecto</div>
            <div className="text-sm">Ciudad, Código Postal</div>
          </div>
          
          <div>
            <div className="text-xs font-semibold mb-1">Enviado A</div>
            <div className="text-sm">Cliente</div>
            <div className="text-sm">Dirección de Facturación</div>
            <div className="text-sm">Ciudad, Código Postal</div>
          </div>
        </div>

        {/* Línea separadora antes de la tabla */}
        <div className="border-b border-gray-300 mb-6"></div>

        {/* Tabla técnica de elementos */}
        {data.length > 0 && (
          <>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold w-8">
                    #
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold">
                    Descripción de Elementos/Servicios
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold w-16">
                    Cant.
                  </th>
                  {pdfParams.showPriceColumn && (
                    <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold w-20">
                      Precio (₹)
                    </th>
                  )}
                  <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold w-16">
                    Desc.
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold w-20">
                    COSTO
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold w-20">
                    SGST
                  </th>
                  <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold w-24">
                    Total (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs">
                      {item.name}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                      {item.amount} {item.unit_name}
                    </td>
                    {pdfParams.showPriceColumn && (
                      <td className="border border-gray-300 px-2 py-2 text-right text-xs">
                        {item.unit_price?.toFixed(2) || '0.00'}
                      </td>
                    )}
                    <td className="border border-gray-300 px-2 py-2 text-center text-xs">
                      0
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-xs">
                      {(item.total_price * 0.9)?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-xs">
                      {(item.total_price * 0.1)?.toFixed(2) || '0.00'}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold">
                      {item.total_price?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Sección de totales y método de pago */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Método de pago */}
              <div>
                <div className="mb-4">
                  <div className="text-xs font-semibold mb-2">Método de Pago</div>
                  <div className="text-sm">Efectivo</div>
                </div>
                
                <div>
                  <div className="text-xs font-semibold mb-2">En Palabras</div>
                  <div className="text-sm italic">
                    {calculateTotal() >= 1000 ? 'Mil' : 'Cientos'} Pesos Únicamente
                  </div>
                </div>
              </div>

              {/* Totales */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Sub Total</span>
                  <span className="text-sm">{(calculateTotal() * 0.9).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">CGST</span>
                  <span className="text-sm">{(calculateTotal() * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">SGST</span>
                  <span className="text-sm">{(calculateTotal() * 0.05).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Total</span>
                    <span className="text-sm font-bold">{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Línea separadora antes de firmas */}
        <div className="border-b border-gray-300 mb-6"></div>

        {/* Sección de firmas técnica */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="text-xs font-semibold mb-4">Aceptado Por</div>
            <div className="text-sm">{organization?.name || 'Empresa'}</div>
            <div className="mt-8 border-t border-gray-400 pt-1">
              <div className="text-xs text-gray-600">Firma</div>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-semibold mb-4">Firma</div>
            <div className="text-sm">Cliente</div>
            <div className="mt-8 border-t border-gray-400 pt-1">
              <div className="text-xs text-gray-600">Firma y Sello</div>
            </div>
          </div>
        </div>

        {/* Información de pago técnica */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-xs font-semibold mb-2">Información de Pago</div>
            <div className="text-xs space-y-1">
              <div><span className="font-semibold">Cuenta #:</span> 1234567890</div>
              <div><span className="font-semibold">Nombre de Cuenta:</span> {organization?.name || 'Empresa'}</div>
              <div><span className="font-semibold">Código IFSC:</span> BANK0001234</div>
              <div><span className="font-semibold">Banco:</span> Banco Principal</div>
              <div><span className="font-semibold">Sucursal:</span> Sucursal Principal</div>
            </div>
          </div>

          {/* QR Code placeholder */}
          <div className="flex flex-col items-end">
            <div className="w-16 h-16 bg-black mb-2 flex items-center justify-center">
              <div className="text-white text-xs text-center">QR<br/>CODE</div>
            </div>
            <div className="text-xs text-right">
              <div className="font-semibold">Nombre: {organization?.name || 'Empresa'}</div>
              <div>UPI: empresa@upi</div>
            </div>
          </div>
        </div>

        {/* Footer técnico */}
        {pdfParams.showFooterInfo && pdfParams.footerInfo && (
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
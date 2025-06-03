interface DefaultTemplateProps {
  template: any;
  organization: any;
  pdfParams: any;
  sectionStates: any;
  data: any[];
  type: 'budget' | 'materials';
  getGridCols: () => string;
  calculateTotal: () => number;
  zoomLevel: number;
}

export default function DefaultTemplate({
  template,
  organization,
  pdfParams,
  sectionStates,
  data,
  type,
  getGridCols,
  calculateTotal,
  zoomLevel
}: DefaultTemplateProps) {
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
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top center',
        overflow: 'hidden'
      }}
    >
      <div className="p-12 text-black">
        {/* Header básico */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              {organization?.name && (
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {organization.name}
                </h1>
              )}
            </div>
            
            <div className="text-right text-sm text-gray-600">
              {organization?.address && (
                <div className="mb-1">{organization.address}</div>
              )}
              {organization?.website && (
                <div className="mb-1">{organization.website}</div>
              )}
              {organization?.email && (
                <div className="mb-1">{organization.email}</div>
              )}
              {organization?.phone && (
                <div className="mb-1">+{organization.phone}</div>
              )}
            </div>
          </div>

          <div className="border-b-2 border-gray-800 pb-2 mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {type === 'budget' ? 'PRESUPUESTO' : 'REPORTE DE MATERIALES'}
            </h2>
          </div>
        </div>

        {/* Información del proyecto */}
        <div className="mb-6">
          <div className="border border-gray-300 p-4">
            <div className="font-semibold mb-2 text-sm">
              Proyecto:
            </div>
            <div className="text-sm">
              <div>{pdfParams.projectCode} - {pdfParams.projectName}</div>
              <div className="mt-2">
                <div>Fecha: {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        {pdfParams.description && (
          <div className="mb-6">
            <div className="border border-gray-300 p-4">
              <div className="font-semibold mb-2 text-sm">
                Descripción:
              </div>
              <div className="text-sm">
                {pdfParams.description}
              </div>
            </div>
          </div>
        )}

        {/* Tabla de elementos */}
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay datos para mostrar en el {type === 'budget' ? 'presupuesto' : 'reporte'}
            </p>
          ) : (
            <>
              <div className="font-semibold mb-3 text-sm">
                Elementos:
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-800">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-800 px-3 py-2 text-left text-sm font-medium">
                        Descripción del Artículo
                      </th>
                      {pdfParams.showUnitColumn && (
                        <th className="border border-gray-800 px-3 py-2 text-center text-sm font-medium">
                          Cant. Unidad
                        </th>
                      )}
                      {pdfParams.showPriceColumn && (
                        <th className="border border-gray-800 px-3 py-2 text-center text-sm font-medium">
                          Precio Unitario
                        </th>
                      )}
                      <th className="border border-gray-800 px-3 py-2 text-right text-sm font-medium">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr key={index} className="bg-white">
                        <td className="border border-gray-800 px-3 py-2 text-sm">
                          {item.name}
                        </td>
                        {pdfParams.showUnitColumn && (
                          <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                            {item.amount} {item.unit_name}
                          </td>
                        )}
                        {pdfParams.showPriceColumn && (
                          <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                            ${item.unit_price?.toFixed(2) || '0.00'}
                          </td>
                        )}
                        <td className="border border-gray-800 px-3 py-2 text-right text-sm">
                          ${item.total_price?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    ))}
                    
                    <tr className="bg-gray-50">
                      <td colSpan={
                        (pdfParams.showUnitColumn ? 1 : 0) + 
                        (pdfParams.showPriceColumn ? 1 : 0) + 1
                      } 
                        className="border border-gray-800 px-3 py-2 text-right font-semibold text-sm"
                      >
                        Total:
                      </td>
                      <td className="border border-gray-800 px-3 py-2 text-right font-bold text-sm">
                        ${calculateTotal().toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer básico */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center">
          <p className="text-xs text-gray-500">
            {pdfParams.footerInfo || 'Documento generado por Archub. www.archub.com'}
          </p>
        </div>
      </div>
    </div>
  );
}
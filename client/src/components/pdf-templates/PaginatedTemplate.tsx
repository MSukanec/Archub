import { ReactNode, useEffect, useState } from 'react';

interface PaginatedTemplateProps {
  children: ReactNode;
  zoomLevel: number;
}

export default function PaginatedTemplate({ children, zoomLevel }: PaginatedTemplateProps) {
  const [pages, setPages] = useState<ReactNode[]>([]);

  useEffect(() => {
    // Por ahora, renderizamos una sola página
    // En el futuro se puede implementar la división automática de contenido
    setPages([children]);
  }, [children]);

  return (
    <div className="space-y-4">
      {pages.map((page, index) => (
        <div 
          key={index}
          className="bg-white shadow-lg border border-gray-300 mx-auto"
          style={{ 
            width: '210mm',
            minHeight: '297mm',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            overflow: 'hidden',
            pageBreakAfter: index < pages.length - 1 ? 'always' : 'auto'
          }}
        >
          {page}
        </div>
      ))}
    </div>
  );
}
const fs = require('fs');
const path = require('path');

// Lista de vistas de administración para actualizar
const adminViews = [
  'AdminMaterials.tsx',
  'AdminMaterialCategories.tsx', 
  'AdminTasks.tsx',
  'AdminCategories.tsx',
  'AdminUsers.tsx',
  'AdminUnits.tsx'
];

const viewsPath = 'client/src/views';

adminViews.forEach(fileName => {
  const filePath = path.join(viewsPath, fileName);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Actualizando: ${fileName}`);
    
    // 1. Agregar imports de paginación si no existen
    if (!content.includes('ChevronLeft, ChevronRight')) {
      content = content.replace(
        /(import.*from 'lucide-react';)/,
        (match) => {
          return match.replace('} from \'lucide-react\';', ', ChevronLeft, ChevronRight } from \'lucide-react\';');
        }
      );
    }
    
    // 2. Agregar estado de paginación
    if (!content.includes('ITEMS_PER_PAGE')) {
      content = content.replace(
        /(const \[sortOrder.*\n)/,
        '$1  const [currentPage, setCurrentPage] = useState(1);\n  \n  const ITEMS_PER_PAGE = 10;\n'
      );
    }
    
    // 3. Reducir altura de filas
    content = content.replace(/py-4/g, 'py-2');
    content = content.replace(/h-16/g, 'h-8');
    
    // 4. Actualizar filtrado para incluir paginación
    content = content.replace(
      /const filtered(\w+) = /,
      'const filteredAndSorted$1 = '
    );
    
    // 5. Agregar lógica de paginación después del filtrado
    const paginationLogic = `
  const totalPages = Math.ceil(filteredAndSorted$1.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginated$1 = filteredAndSorted$1.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);`;
    
    content = content.replace(
      /(\.sort\(.*?\n.*?\}\);\n)/s,
      '$1' + paginationLogic.replace(/\$1/g, fileName.replace('Admin', '').replace('.tsx', ''))
    );
    
    // 6. Actualizar referencias a usar datos paginados
    const entityName = fileName.replace('Admin', '').replace('.tsx', '').toLowerCase();
    content = content.replace(
      new RegExp(`filtered${fileName.replace('Admin', '').replace('.tsx', '')}(?!\\.length)`, 'g'),
      `paginated${fileName.replace('Admin', '').replace('.tsx', '')}`
    );
    
    // 7. Agregar paginación centrada antes del cierre de la tabla
    const paginationComponent = `
        
        {/* Paginación centrada */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-3 px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredAndSorted${fileName.replace('Admin', '').replace('.tsx', '')}.length)} de {filteredAndSorted${fileName.replace('Admin', '').replace('.tsx', '')}.length} elementos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0 rounded-lg"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}`;
    
    content = content.replace(
      /(\s+<\/Table>\s+)/,
      '$1' + paginationComponent + '\n      '
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Actualizado: ${fileName}`);
  } else {
    console.log(`✗ No encontrado: ${fileName}`);
  }
});

console.log('Actualización completada');
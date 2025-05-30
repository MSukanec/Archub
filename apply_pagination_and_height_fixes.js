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
    
    // 1. Agregar imports de paginación
    if (!content.includes('ChevronLeft, ChevronRight')) {
      content = content.replace(
        /} from 'lucide-react';/,
        ', ChevronLeft, ChevronRight, X } from \'lucide-react\';'
      );
    }
    
    // 2. Agregar estado de paginación si no existe
    const hasPageState = content.includes('currentPage');
    if (!hasPageState) {
      content = content.replace(
        /(const \[sortOrder.*\n)/,
        '$1  const [currentPage, setCurrentPage] = useState(1);\n  \n  const ITEMS_PER_PAGE = 10;\n'
      );
    }
    
    // 3. Actualizar altura de filas y texto
    content = content.replace(/py-4/g, 'py-1');
    content = content.replace(/py-8/g, 'py-4');
    content = content.replace(/h-16/g, 'h-8');
    content = content.replace(/h-12/g, 'h-10');
    
    // 4. Hacer texto más pequeño en celdas
    content = content.replace(
      /(className="[^"]*font-medium[^"]*")/g,
      '$1 text-sm'
    );
    
    // 5. Agregar botón X para limpiar búsqueda
    const searchPattern = /<div className="relative flex-1">\s*<Search[^>]+\/>\s*<Input[^>]+\/>\s*<\/div>/s;
    if (content.match(searchPattern)) {
      const newSearchField = `<div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-background border-border rounded-xl"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
          </div>`;
      
      content = content.replace(searchPattern, newSearchField);
    }
    
    // 6. Actualizar lógica de filtrado para paginación
    const entityName = fileName.replace('Admin', '').replace('.tsx', '');
    const variableName = entityName.toLowerCase();
    
    if (content.includes(`filtered${entityName}`)) {
      // Cambiar nombre de variable
      content = content.replace(
        new RegExp(`const filtered${entityName}`, 'g'),
        `const filteredAndSorted${entityName}`
      );
      
      // Agregar lógica de paginación
      const paginationLogic = `
  const totalPages = Math.ceil(filteredAndSorted${entityName}.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginated${entityName} = filteredAndSorted${entityName}.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);`;
      
      content = content.replace(
        /(\.sort\([^}]+\}\);\n)/,
        '$1' + paginationLogic
      );
      
      // Actualizar referencias en la tabla
      content = content.replace(
        new RegExp(`filtered${entityName}(?!\\.length)`, 'g'),
        `paginated${entityName}`
      );
    }
    
    // 7. Agregar paginación centrada si no existe
    if (!content.includes('Paginación centrada')) {
      const paginationComponent = `
        
        {/* Paginación centrada */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-3 px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredAndSorted${entityName}.length)} de {filteredAndSorted${entityName}.length} elementos
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
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Actualizado: ${fileName}`);
  } else {
    console.log(`✗ No encontrado: ${fileName}`);
  }
});

console.log('Actualización completada');
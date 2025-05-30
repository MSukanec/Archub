const fs = require('fs');
const path = require('path');

// Lista de vistas de administración
const adminViews = [
  'AdminUnits.tsx',
  'AdminMaterials.tsx', 
  'AdminMaterialCategories.tsx',
  'AdminTasks.tsx',
  'AdminCategories.tsx',
  'AdminUsers.tsx',
  'AdminElements.tsx'
];

const viewsPath = 'client/src/views';

adminViews.forEach(fileName => {
  const filePath = path.join(viewsPath, fileName);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Actualizando: ${fileName}`);
    
    // 1. Agregar imports necesarios
    if (!content.includes('useEffect')) {
      content = content.replace(
        /import { useState/,
        'import { useState, useEffect'
      );
    }
    
    if (!content.includes('ChevronLeft, ChevronRight, X')) {
      content = content.replace(
        /} from 'lucide-react';/,
        ', ChevronLeft, ChevronRight, X } from \'lucide-react\';'
      );
    }
    
    // 2. Agregar estados de paginación
    const hasPageState = content.includes('currentPage');
    if (!hasPageState) {
      const statePattern = /(const \[selectedUnit.*?\] = useState<any>\(null\);)/;
      if (content.match(statePattern)) {
        content = content.replace(
          statePattern,
          '$1\n  const [currentPage, setCurrentPage] = useState(1);\n  \n  const ITEMS_PER_PAGE = 10;'
        );
      }
    }
    
    // 3. Reducir altura de filas y agregar hover
    content = content.replace(/py-4/g, 'py-1');
    content = content.replace(/py-8/g, 'py-2');
    content = content.replace(/h-16/g, 'h-8');
    content = content.replace(/h-12/g, 'h-6');
    content = content.replace(/text-sm/g, 'text-xs');
    
    // 4. Agregar hover effect a filas
    content = content.replace(
      /className="border-border"/g,
      'className="border-border hover:bg-muted/50 transition-colors"'
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
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Actualizado: ${fileName}`);
  } else {
    console.log(`✗ No encontrado: ${fileName}`);
  }
});

console.log('Actualización de alturas y hover effects completada');
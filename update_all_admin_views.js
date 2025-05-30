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
    
    // 1. Agregar import de X si no existe
    if (!content.includes(', X ') && content.includes('lucide-react')) {
      content = content.replace(
        /} from 'lucide-react';/,
        ', X } from \'lucide-react\';'
      );
    }
    
    // 2. Actualizar el campo de búsqueda para incluir botón X
    const searchFieldPattern = /<div className="relative flex-1">\s*<Search[^>]+\/>\s*<Input[^>]+\/>\s*<\/div>/s;
    
    if (content.match(searchFieldPattern)) {
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
      
      content = content.replace(searchFieldPattern, newSearchField);
    }
    
    // 3. Reducir altura de filas (cambiar py-2 por py-1 y h-8 por h-6)
    content = content.replace(/py-2(?=.*TableCell)/g, 'py-1');
    content = content.replace(/h-8(?=.*TableCell)/g, 'h-6');
    
    // 4. Agregar text-sm a los contenidos de las celdas
    content = content.replace(
      /<div className="([^"]*font-medium[^"]*)">/g,
      '<div className="$1 text-sm">'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Actualizado: ${fileName}`);
  } else {
    console.log(`✗ No encontrado: ${fileName}`);
  }
});

console.log('Actualización completada');
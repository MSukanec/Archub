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
    
    // 1. Agregar imports necesarios para paginación
    if (!content.includes('ChevronLeft, ChevronRight')) {
      content = content.replace(
        /from 'lucide-react';/,
        match => {
          const imports = match.replace(/} from 'lucide-react';/, '');
          return imports + ', ChevronLeft, ChevronRight } from \'lucide-react\';';
        }
      );
    }
    
    // 2. Agregar Select components si no existen
    if (!content.includes('SelectContent')) {
      const selectImport = `import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';`;
      
      content = content.replace(
        /import { cn } from '@\/lib\/utils';/,
        selectImport + '\nimport { cn } from \'@/lib/utils\';'
      );
    }
    
    // 3. Agregar estados de paginación y ordenamiento
    content = content.replace(
      /const \[searchTerm, setSearchTerm\] = useState\(''\);/,
      `const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 10;`
    );
    
    // 4. Actualizar altura de filas en TableCell
    content = content.replace(/className="py-4/g, 'className="py-2');
    content = content.replace(/className="text-center py-4/g, 'className="text-center py-2');
    content = content.replace(/h-16/g, 'h-8');
    
    // 5. Cambiar filtro por defecto a selector de ordenamiento más compacto
    content = content.replace(
      /w-\[200px\]/g, 'w-[160px]'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Actualizado: ${fileName}`);
  } else {
    console.log(`✗ No encontrado: ${fileName}`);
  }
});

console.log('Actualización de vistas de administración completada');
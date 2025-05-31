import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viewsPath = path.join(__dirname, 'client', 'src', 'views', 'admin');

// Lista de archivos de vistas admin que necesitan actualización
const adminViews = [
  'AdminActions.tsx',
  'AdminCategories.tsx',
  'AdminElements.tsx', 
  'AdminMaterialCategories.tsx',
  'AdminMaterials.tsx',
  'AdminOrganizations.tsx',
  'AdminTasks.tsx',
  'AdminUnits.tsx',
  'AdminUsers.tsx'
];

adminViews.forEach(fileName => {
  const filePath = path.join(viewsPath, fileName);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Actualizando colores de botones en: ${fileName}`);
    
    // Cambiar botones de edición de colores primarios a grises
    content = content.replace(
      /className="text-primary hover:text-primary\/80 hover:bg-primary\/10/g,
      'className="text-muted-foreground hover:text-foreground hover:bg-muted/50'
    );
    
    // También manejar variaciones sin el hover:bg-primary/10
    content = content.replace(
      /className="text-primary hover:text-primary\/80/g,
      'className="text-muted-foreground hover:text-foreground'
    );
    
    // Arreglar botones de eliminar para que tengan efecto sin fondo
    content = content.replace(
      /className="text-destructive hover:text-destructive\/80 hover:bg-destructive\/10/g,
      'className="text-destructive hover:text-destructive/90'
    );
    
    // Manejar text-blue-600 si existe
    content = content.replace(
      /text-blue-600/g,
      'text-muted-foreground'
    );
    
    // Manejar text-green-600 si existe  
    content = content.replace(
      /text-green-600/g,
      'text-muted-foreground'
    );
    
    // Escribir el archivo actualizado
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ ${fileName} actualizado correctamente`);
  } else {
    console.log(`⚠ Archivo no encontrado: ${fileName}`);
  }
});

console.log('\n🎉 Actualización de colores de botones completada');
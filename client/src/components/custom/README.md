# Componentes Personalizados - Archmony

Esta carpeta contiene todos los componentes específicos del proyecto Archmony, organizados por categoría para facilitar su localización y mantenimiento.

## Estructura de Carpetas

### `/forms`
Componentes de formularios específicos del proyecto:
- Formularios de registro de obra
- Formularios de movimientos financieros
- Formularios de gestión de contactos

### `/tables` 
Tablas y componentes de visualización de datos:
- Tablas de movimientos
- Tablas de presupuestos
- Tablas de personal

### `/cards`
Componentes de tarjetas y resúmenes:
- Tarjetas de proyecto
- Tarjetas de resumen financiero
- Tarjetas de información de obra

### `/inputs`
Inputs y controles específicos:
- Selectores de categorías
- Inputs de cantidades
- Controles de fechas especializados

### `/modals`
Modales específicos del proyecto (mover aquí gradualmente):
- Modales de bitácora
- Modales de administración
- Modales de confirmación

## Guías de Uso

- **Nuevos componentes**: Crear siempre en la subcarpeta apropiada
- **Nombrado**: Usar PascalCase descriptivo (ej: `SiteLogFormSection.tsx`)
- **Exportación**: Incluir export en `index.ts` de cada subcarpeta
- **Importación**: Usar rutas relativas desde `@/components/custom/`

## Migración Gradual

Los componentes existentes se migrarán gradualmente a esta estructura para evitar romper funcionalidades existentes.
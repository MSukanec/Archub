import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Users, Search, Plus, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, X, MessageCircle, Tags } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { cn } from '../lib/utils';
import { useToast } from '../hooks/use-toast';
import { contactsService, Contact } from '../lib/contactsService';
import { contactTypesService } from '../lib/contactTypesService';
import AdminContactsModal from '../components/modals/AdminContactsModal';
import ContactActionsModal from '../components/modals/ContactActionsModal';
import { ContactTypeDisplay } from '../components/ui/ContactTypeDisplay';

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [contactTypeFilter, setContactTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isContactActionsModalOpen, setIsContactActionsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  
  const ITEMS_PER_PAGE = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listener para el botón flotante
  useEffect(() => {
    const handleOpenCreateContactModal = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener('openCreateContactModal', handleOpenCreateContactModal);
    
    return () => {
      window.removeEventListener('openCreateContactModal', handleOpenCreateContactModal);
    };
  }, []);

  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/contacts'],
    queryFn: contactsService.getAll,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const { data: contactTypes = [] } = useQuery({
    queryKey: ['/api/contact-types'],
    queryFn: contactTypesService.getContactTypes,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contacts'] });
      toast({
        title: 'Éxito',
        description: 'Contacto eliminado correctamente',
      });
      setIsDeleteDialogOpen(false);
      setSelectedContact(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar el contacto',
        variant: 'destructive',
      });
    },
  });

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gestión de Contactos</h1>
            <p className="text-sm text-muted-foreground">Administra todos los contactos del sistema</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Error al cargar contactos</h3>
            <p className="text-muted-foreground max-w-md">No se pudieron cargar los contactos. Intenta recargar la página.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = (contact: any) => {
    setSelectedContact(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (contact: any) => {
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  };

  const handleContactActions = (contact: any) => {
    setSelectedContact(contact);
    setIsContactActionsModalOpen(true);
  };

  const filteredAndSortedContacts = contacts
    .filter((contact: any) => {
      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
      const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (contact.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = contactTypeFilter === 'all' || 
        (contact.contact_types && contact.contact_types.some((type: any) => type.name === contactTypeFilter));
      
      return matchesSearch && matchesType;
    })
    .sort((a: any, b: any) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.created_at || b.id).getTime() - new Date(a.created_at || a.id).getTime();
        case 'oldest':
          return new Date(a.created_at || a.id).getTime() - new Date(b.created_at || b.id).getTime();
        case 'name':
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim();
          return nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedContacts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedContacts = filteredAndSortedContacts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder, contactTypeFilter]);

  if (isLoading) {
    return <AdminContactsSkeleton />;
  }

  return (
    <div className="p-6 md:p-6 p-3 space-y-6 md:space-y-6 space-y-3">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Gestión de Contactos</h1>
              <p className="text-sm text-muted-foreground">Administra todos los contactos del sistema</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Contacto
          </Button>
        </div>



      <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar contactos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Filtro por tipo de contacto */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[180px] justify-start text-left font-normal rounded-xl bg-surface-secondary border-input"
              >
                <Tags className="mr-2 h-4 w-4" />
                {contactTypeFilter === 'all' ? "Todos los tipos" : contactTypeFilter}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-2 bg-surface-secondary">
              <div className="space-y-1">
                <Button
                  variant={contactTypeFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setContactTypeFilter('all')}
                  className="w-full justify-start text-sm h-8"
                >
                  Todos los tipos
                </Button>
                {contactTypes.map((type: any) => (
                  <Button
                    key={type.id}
                    variant={contactTypeFilter === type.name ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setContactTypeFilter(type.name)}
                    className="w-full justify-start text-sm h-8"
                  >
                    {type.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Filtro de ordenamiento */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-start text-left font-normal rounded-xl bg-surface-secondary border-input"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {sortOrder === 'newest' ? "Más reciente primero" : sortOrder === 'oldest' ? "Más antiguo primero" : "Orden alfabético"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2 bg-surface-secondary">
              <div className="space-y-1">
                <Button
                  variant={sortOrder === 'newest' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortOrder('newest')}
                  className="w-full justify-start text-sm h-8"
                >
                  Más reciente primero
                </Button>
                <Button
                  variant={sortOrder === 'oldest' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortOrder('oldest')}
                  className="w-full justify-start text-sm h-8"
                >
                  Más antiguo primero
                </Button>
                <Button
                  variant={sortOrder === 'name' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortOrder('name')}
                  className="w-full justify-start text-sm h-8"
                >
                  Orden alfabético
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl shadow-md bg-surface-secondary border-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/50">
              <TableHead className="text-foreground font-semibold h-12 text-center">Nombre</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Tipo</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Empresa</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Email</TableHead>
              <TableHead className="text-foreground font-semibold h-12 text-center">Teléfono</TableHead>
              <TableHead className="text-foreground font-semibold text-center h-12">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-4 h-8">
                  {searchTerm 
                    ? 'No se encontraron contactos que coincidan con los filtros.'
                    : 'No hay contactos registrados.'
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map((contact: any) => (
                <TableRow key={contact.id} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="py-2 text-center">
                    <div className="font-medium text-foreground">
                      {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Sin nombre'}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-center">
                    <ContactTypeDisplay contactId={contact.id} />
                  </TableCell>
                  <TableCell className="py-2 text-center">
                    <div className="text-foreground">{contact.company_name || '-'}</div>
                  </TableCell>
                  <TableCell className="py-2 text-center">
                    <div className="text-foreground">{contact.email || '-'}</div>
                  </TableCell>
                  <TableCell className="py-2 text-center">
                    <div className="text-foreground">{contact.phone || '-'}</div>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="flex items-center justify-center gap-2">
                      {(contact.phone || contact.email) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContactActions(contact)}
                          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(contact)}
                        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contact)}
                        className="text-destructive hover:text-destructive/90 h-8 w-8 p-0 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Paginación Desktop */}
        {filteredAndSortedContacts.length > 0 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedContacts.length)} de {filteredAndSortedContacts.length} elementos
            </div>
            
            {totalPages > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-xl border-border"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "ghost"}
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
                  className="rounded-xl border-border"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {paginatedContacts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm 
              ? 'No se encontraron contactos que coincidan con los filtros.'
              : 'No hay contactos registrados.'
            }
          </div>
        ) : (
          paginatedContacts.map((contact: any) => (
            <div key={contact.id} className="bg-surface-secondary rounded-2xl p-4 shadow-md border-0">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">
                      {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Sin nombre'}
                    </h3>
                    {contact.company_name && (
                      <p className="text-sm text-muted-foreground mt-1">{contact.company_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(contact.phone || contact.email) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContactActions(contact)}
                        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(contact)}
                      className="text-muted-foreground hover:text-foreground h-8 w-8 p-0 rounded-lg"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(contact)}
                      className="text-destructive hover:text-destructive/90 h-8 w-8 p-0 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <ContactTypeDisplay contactId={contact.id} />
                  </div>
                  
                  {contact.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm text-foreground">{contact.email}</span>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Teléfono:</span>
                      <span className="text-sm text-foreground">{contact.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-surface-secondary border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl font-semibold">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. Esto eliminará permanentemente el contacto
              <span className="font-semibold text-foreground"> "{selectedContact?.first_name} {selectedContact?.last_name}"</span> y 
              todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-border text-foreground hover:bg-muted rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedContact) {
                  deleteMutation.mutate(selectedContact.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Contact Modal */}
      <AdminContactsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Contact Modal */}
      <AdminContactsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedContact(null);
        }}
        contact={selectedContact}
      />

      {/* Contact Actions Modal */}
      <ContactActionsModal
        isOpen={isContactActionsModalOpen}
        onClose={() => {
          setIsContactActionsModalOpen(false);
          setSelectedContact(null);
        }}
        contact={selectedContact}
      />

      {/* Floating Action Button for Mobile and Tablet */}
      <Button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 md:hidden w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg p-0 flex items-center justify-center"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}

function AdminContactsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-xl animate-pulse"></div>
          <div>
            <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2"></div>
          </div>
        </div>
        <div className="h-10 w-40 bg-muted rounded-xl animate-pulse"></div>
      </div>
      
      <div className="rounded-2xl shadow-md bg-surface-secondary p-6 border-0">
        <div className="flex gap-4">
          <div className="h-10 flex-1 bg-muted rounded-xl animate-pulse"></div>
          <div className="h-10 w-48 bg-muted rounded-xl animate-pulse"></div>
        </div>
      </div>
      
      <div className="rounded-2xl shadow-md bg-surface-secondary border-0 overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-xl animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-muted rounded-lg animate-pulse"></div>
                  <div className="h-8 w-8 bg-muted rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { AdminContactsSkeleton };
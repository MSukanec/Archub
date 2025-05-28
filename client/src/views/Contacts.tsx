import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Mail, Phone, Building2, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { contactsService, Contact } from '@/lib/contactsService';
import ContactModal from '@/components/modals/ContactModal';

const CONTACT_TYPES = [
  { value: 'proveedor', label: 'Proveedor', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'contratista', label: 'Contratista', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'tecnico', label: 'Técnico', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  { value: 'cliente', label: 'Cliente', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'otro', label: 'Otro', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
];

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Listen for floating action button events
  useEffect(() => {
    const handleOpenCreateContactModal = () => {
      setSelectedContact(null);
      setIsModalOpen(true);
    };

    window.addEventListener('openCreateContactModal', handleOpenCreateContactModal);
    return () => {
      window.removeEventListener('openCreateContactModal', handleOpenCreateContactModal);
    };
  }, []);

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Solo cargar una vez por sesión
    refetchOnReconnect: false,
    retry: 1, // Solo 1 reintento
    retryDelay: 3000, // 3 segundos entre reintentos
  });

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => contactsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
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

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleDelete = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedContact) {
      deleteMutation.mutate(selectedContact.id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
  };

  const getContactTypeInfo = (type: string) => {
    return CONTACT_TYPES.find(t => t.value === type) || CONTACT_TYPES[4]; // Default to 'otro'
  };

  // Filter contacts based on search term and selected type
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
    const matchesSearch = 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.company_name && contact.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !selectedType || selectedType === 'all' || contact.contact_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando contactos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agenda de Contactos</h1>
          <p className="text-muted-foreground">Gestiona proveedores, contratistas y otros contactos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {CONTACT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Fecha de registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchTerm || selectedType ? 'No se encontraron contactos con los filtros aplicados' : 'No hay contactos registrados'}
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => {
                const typeInfo = getContactTypeInfo(contact.contact_type);
                return (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{`${contact.first_name} ${contact.last_name || ''}`.trim()}</TableCell>
                    <TableCell>
                      <Badge className={typeInfo.color}>
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{contact.company_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {contact.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {!contact.email && !contact.phone && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{contact.location}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{formatDate(contact.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contact)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        contact={selectedContact}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El contacto "{selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name || ''}`.trim() : ''}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Mail, Phone, Building2, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { contactsService, Contact } from '@/lib/contactsService';
import { contactTypesService, ContactType } from '@/lib/contactTypesService';
import ContactModal from '@/components/modals/ContactModal';

// Extended contact with types
interface ContactWithTypes extends Contact {
  contact_types?: ContactType[];
}

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactsWithTypes, setContactsWithTypes] = useState<ContactWithTypes[]>([]);
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
  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false, // No reintentos para evitar bucles
  });

  // Fetch available contact types for filtering
  const { data: availableTypes = [] } = useQuery({
    queryKey: ['contact-types'],
    queryFn: contactTypesService.getAll,
  });

  // Log error if any
  if (error) {
    console.error('Error fetching contacts:', error);
  }

  // Load contact types for each contact
  useEffect(() => {
    if (contacts.length > 0) {
      Promise.all(
        contacts.map(async (contact) => {
          const types = await contactTypesService.getContactTypes(contact.id);
          return { ...contact, contact_types: types };
        })
      ).then(setContactsWithTypes);
    } else {
      setContactsWithTypes([]);
    }
  }, [contacts]);

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsService.delete(id),
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

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // Return cleaned phone number
    return cleaned;
  };

  const handleWhatsAppClick = (phone: string) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  // Filter contacts based on search term and selected type
  const filteredContacts = contactsWithTypes.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
    const matchesSearch = 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.company_name && contact.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === '' || selectedType === 'all' || 
      (contact.contact_types && contact.contact_types.some(type => type.id === selectedType));
    
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground">
            Gestiona los contactos de proveedores, contratistas y otros colaboradores del proyecto.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar contactos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contacts Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Apellido</TableHead>
              <TableHead>Tipos</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Cargando contactos...
                </TableCell>
              </TableRow>
            ) : filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {contactsWithTypes.length === 0 ? 'No hay contactos registrados.' : 'No se encontraron contactos que coincidan con los filtros.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.first_name}</TableCell>
                  <TableCell>{contact.last_name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.contact_types && contact.contact_types.length > 0 ? (
                        contact.contact_types.map((type, index) => (
                          <Badge key={type.id} className={getTypeColor(index)}>
                            {type.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin tipos</span>
                      )}
                    </div>
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => contact.phone && handleWhatsAppClick(contact.phone)}
                              disabled={!contact.phone}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground disabled:opacity-50"
                            >
                              <Phone className="h-4 w-4" />
                              <span className="sr-only">Contactar por WhatsApp</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{contact.phone ? 'Contactar por WhatsApp' : 'Teléfono no disponible'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(contact)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar contacto</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(contact)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar contacto</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
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
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El contacto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
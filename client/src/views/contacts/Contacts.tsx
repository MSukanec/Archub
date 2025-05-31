import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Edit, Trash2, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { contactsService, Contact } from '@/lib/contactsService';
import { contactTypesService, ContactType } from '@/lib/contactTypesService';
import ContactsModal from '@/components/modals/ContactsModal';

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

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.getAll,
  });

  // Fetch available contact types for filtering
  const { data: availableTypes = [] } = useQuery({
    queryKey: ['contact-types'],
    queryFn: contactTypesService.getAll,
  });

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

  const handleCreate = () => {
    setSelectedContact(null);
    setIsModalOpen(true);
  };

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

  // Filter contacts based on search term and selected type
  const filteredContacts = contactsWithTypes.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim();
    const matchesSearch = 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.company_name && contact.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !selectedType || selectedType === 'all' || 
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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 bg-[#e1e1e1] p-6 border-b border-[#919191]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#919191]/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-[#919191]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#919191]">Gestión de Contactos</h1>
              <p className="text-sm text-[#919191]/70">
                Administra contactos de proveedores, contratistas y colaboradores
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 bg-[#e1e1e1] p-4 border-b border-[#919191]/20">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar contactos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#919191]/60" />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48 bg-[#d2d2d2] border-[#919191]/20 focus:border-primary focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent className="bg-[#d2d2d2] border-[#919191]/20">
              <SelectItem value="all">Todos los tipos</SelectItem>
              {availableTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden bg-[#e1e1e1]">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-[#e1e1e1] z-10">
              <TableRow className="border-b border-[#919191]/20">
                <TableHead className="text-xs font-medium text-[#919191] bg-[#e1e1e1]">Nombre</TableHead>
                <TableHead className="text-xs font-medium text-[#919191] bg-[#e1e1e1]">Empresa</TableHead>
                <TableHead className="text-xs font-medium text-[#919191] bg-[#e1e1e1]">Tipos</TableHead>
                <TableHead className="text-xs font-medium text-[#919191] bg-[#e1e1e1]">Email</TableHead>
                <TableHead className="text-xs font-medium text-[#919191] bg-[#e1e1e1]">Teléfono</TableHead>
                <TableHead className="text-xs font-medium text-[#919191] bg-[#e1e1e1]">Ubicación</TableHead>
                <TableHead className="text-xs font-medium text-[#919191] bg-[#e1e1e1] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-[#919191]/70">
                    Cargando contactos...
                  </TableCell>
                </TableRow>
              ) : filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-[#919191]/70">
                    {contactsWithTypes.length === 0 ? 'No hay contactos registrados.' : 'No se encontraron contactos que coincidan con los filtros.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="border-b border-[#919191]/10 hover:bg-[#919191]/5">
                    <TableCell className="text-sm text-[#919191]">
                      {`${contact.first_name} ${contact.last_name || ''}`.trim()}
                    </TableCell>
                    <TableCell className="text-sm text-[#919191]">
                      {contact.company_name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.contact_types && contact.contact_types.length > 0 ? (
                          contact.contact_types.map((type) => (
                            <Badge key={type.id} className="bg-[#919191]/20 text-[#919191] text-xs">
                              {type.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[#919191]/50 text-sm">Sin tipo</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[#919191]">
                      {contact.email || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-[#919191]">
                      {contact.phone || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-[#919191]">
                      {contact.location || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(contact)}
                          className="h-8 w-8 p-0 text-[#919191] hover:text-[#919191] hover:bg-[#919191]/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contact)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleCreate}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Contact Modal */}
      <ContactsModal
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
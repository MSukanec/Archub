import { useQuery } from '@tanstack/react-query';
import { contactTypesService } from '../lib/contactTypesService';

interface ContactTypeDisplayProps {
  contactId: string;
}

export function ContactTypeDisplay({ contactId }: ContactTypeDisplayProps) {
  const { data: contactTypes = [], isLoading } = useQuery({
    queryKey: ['/api/contact-types', contactId],
    queryFn: () => contactTypesService.getContactTypesByContactId(contactId),
    enabled: !!contactId,
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando...</div>;
  }

  if (contactTypes.length === 0) {
    return <div className="text-muted-foreground">-</div>;
  }

  return (
    <div className="text-foreground">
      {contactTypes.map(type => type.name).join(', ')}
    </div>
  );
}
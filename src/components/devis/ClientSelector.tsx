import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subscribeClients, type Client } from '@/data/clientsStore';

interface ClientSelectorProps {
  selectedClient: {
    reference: string;
    nom: string;
    adresse: string;
    email?: string;
    telephone?: string;
  };
  onClientChange: (client: Client | { reference: string; nom: string; adresse: string; email?: string; telephone?: string }) => void;
  fieldErrors?: Set<string>;
}

export function ClientSelector({ selectedClient, onClientChange, fieldErrors = new Set() }: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isNewClient, setIsNewClient] = useState(!selectedClient.reference);
  const [clients, setClients] = useState<Client[]>([]);

  const getErrorClass = (fieldName: string) => {
    return fieldErrors.has(fieldName) ? 'border-destructive ring-1 ring-destructive' : '';
  };

  // S'abonner aux changements du store
  useEffect(() => {
    const unsubscribe = subscribeClients(setClients);
    return unsubscribe;
  }, []);

  const handleSelectClient = (client: Client) => {
    onClientChange(client);
    setIsNewClient(false);
    setOpen(false);
  };

  const handleNewClient = () => {
    onClientChange({ reference: '', nom: '', adresse: '', email: '', telephone: '' });
    setIsNewClient(true);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedClient.nom || 'Sélectionner un client existant...'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Rechercher un client..." />
              <CommandList>
                <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                <CommandGroup heading="Clients existants">
                  {clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      value={`${client.nom} ${client.reference}`}
                      onSelect={() => handleSelectClient(client)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedClient.reference === client.reference
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{client.nom}</span>
                        <span className="text-xs text-muted-foreground">
                          {client.reference} • {client.email}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup>
                  <CommandItem
                    onSelect={handleNewClient}
                    className="cursor-pointer text-primary"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Créer un nouveau client
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Champs client (pré-remplis ou vides) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Référence client</Label>
          <Input
            value={selectedClient.reference}
            onChange={(e) => onClientChange({ ...selectedClient, reference: e.target.value })}
            placeholder="CLI-XXX"
            disabled={!isNewClient && !!selectedClient.reference}
          />
        </div>
        <div className="space-y-2">
          <Label>Nom / Raison sociale</Label>
          <Input
            value={selectedClient.nom}
            onChange={(e) => onClientChange({ ...selectedClient, nom: e.target.value })}
            placeholder="Entreprise SAS"
            disabled={!isNewClient && !!selectedClient.nom}
            className={getErrorClass('client.nom')}
            data-error={fieldErrors.has('client.nom')}
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={selectedClient.email || ''}
            onChange={(e) => onClientChange({ ...selectedClient, email: e.target.value })}
            placeholder="contact@exemple.fr"
            disabled={!isNewClient && !!selectedClient.email}
          />
        </div>
        <div className="space-y-2">
          <Label>Téléphone</Label>
          <Input
            value={selectedClient.telephone || ''}
            onChange={(e) => onClientChange({ ...selectedClient, telephone: e.target.value })}
            placeholder="01 23 45 67 89"
            disabled={!isNewClient && !!selectedClient.telephone}
          />
        </div>
      </div>
    </div>
  );
}

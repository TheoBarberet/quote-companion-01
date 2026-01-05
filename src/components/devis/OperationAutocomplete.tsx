import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface EtapeCatalogue {
  id: string;
  operation: string;
  taux_horaire: number;
}

interface OperationAutocompleteProps {
  value: string;
  tauxHoraire: number;
  onChange: (operation: string, tauxHoraire: number) => void;
  className?: string;
}

export function OperationAutocomplete({ 
  value, 
  tauxHoraire,
  onChange, 
  className 
}: OperationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<EtapeCatalogue[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Search suggestions
  useEffect(() => {
    const searchOperations = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('etapes_production_catalogue')
        .select('*')
        .ilike('operation', `%${query}%`)
        .limit(5);

      if (!error && data) {
        setSuggestions(data);
      }
    };

    const debounce = setTimeout(searchOperations, 150);
    return () => clearTimeout(debounce);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        // If no match found and query differs from value, create new
        if (query !== value && query.trim()) {
          onChange(query, tauxHoraire);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, value, tauxHoraire, onChange]);

  const handleSelect = async (etape: EtapeCatalogue) => {
    setQuery(etape.operation);
    onChange(etape.operation, etape.taux_horaire);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        // Create new with current taux
        onChange(query, tauxHoraire);
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        } else {
          // Create new
          onChange(query, tauxHoraire);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleBlur = async () => {
    // Delay to allow click on suggestion
    setTimeout(async () => {
      if (!isOpen) return;
      
      // Check if exact match exists
      const exactMatch = suggestions.find(
        s => s.operation.toLowerCase() === query.toLowerCase()
      );
      
      if (exactMatch) {
        onChange(exactMatch.operation, exactMatch.taux_horaire);
      } else if (query.trim() && query !== value) {
        // New operation - insert to catalog
        const { data, error } = await supabase
          .from('etapes_production_catalogue')
          .insert({ operation: query.trim(), taux_horaire: tauxHoraire })
          .select()
          .single();
        
        if (!error && data) {
          onChange(data.operation, data.taux_horaire);
        } else {
          // If insert failed (duplicate), just update local
          onChange(query.trim(), tauxHoraire);
        }
      }
      setIsOpen(false);
    }, 200);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn("h-9", className)}
        placeholder="Rechercher ou créer une opération..."
      />
      
      {isOpen && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((etape, index) => (
            <div
              key={etape.id}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm flex justify-between items-center",
                "hover:bg-accent hover:text-accent-foreground",
                highlightedIndex === index && "bg-accent text-accent-foreground"
              )}
              onMouseDown={() => handleSelect(etape)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="truncate flex-1">{etape.operation}</span>
              <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                {etape.taux_horaire.toFixed(2)} €/h
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

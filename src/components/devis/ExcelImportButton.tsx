import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExtractedData {
  client?: {
    reference?: string;
    nom?: string;
    adresse?: string;
    email?: string;
    telephone?: string;
  };
  produit?: {
    reference?: string;
    designation?: string;
    quantite?: number;
    variantes?: string;
  };
}

interface ExcelImportButtonProps {
  onDataExtracted: (data: ExtractedData) => void;
}

export function ExcelImportButton({ onDataExtracted }: ExcelImportButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({
        title: 'Format non supporté',
        description: 'Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Lire le fichier comme texte/base64 pour l'envoyer à l'IA
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Simulation de l'extraction IA (à remplacer par un vrai appel API)
        // Pour l'instant, on simule avec des données mock
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Données simulées extraites
        const extractedData: ExtractedData = {
          client: {
            reference: 'CLI-' + Math.floor(Math.random() * 1000),
            nom: 'Entreprise importée',
            adresse: 'Adresse extraite du document',
            email: 'contact@exemple.fr',
            telephone: '01 23 45 67 89'
          },
          produit: {
            reference: 'PRD-' + Math.floor(Math.random() * 1000),
            designation: 'Produit extrait',
            quantite: 100,
            variantes: 'Standard'
          }
        };

        onDataExtracted(extractedData);
        toast({
          title: 'Données extraites',
          description: 'Les informations du document ont été analysées et importées'
        });

        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Erreur d\'import',
        description: 'Impossible de traiter le fichier',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }

    // Reset l'input pour permettre de réimporter le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-4 h-4" />
            Importer Excel
          </>
        )}
      </Button>
    </>
  );
}

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

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
  composants?: Array<{
    id: string;
    reference?: string;
    designation: string;
    fournisseur?: string;
    prixUnitaire?: number;
    quantite?: number;
  }>;
  matieresPremières?: Array<{
    id: string;
    type: string;
    fournisseur?: string;
    prixKg?: number;
    quantiteKg?: number;
  }>;
}

interface ExcelImportButtonProps {
  onDataExtracted: (data: ExtractedData) => void;
}

// Patterns pour identifier les champs dans le fichier Excel
const PATTERNS = {
  // Client patterns
  clientName: /^(client|société|societe|entreprise|raison\s*sociale|nom\s*(du\s*)?client|customer|company)/i,
  address: /^(adresse|address|lieu|location|site)/i,
  email: /^(email|e-mail|courriel|mail)/i,
  phone: /^(téléphone|telephone|tel|phone|mobile|portable)/i,
  clientRef: /^(référence\s*client|ref\s*client|client\s*ref|code\s*client)/i,
  
  // Product patterns
  productName: /^(produit|désignation|designation|article|libellé|libelle|product|description|intitulé)/i,
  productRef: /^(référence|reference|ref|code|sku)/i,
  quantity: /^(quantité|quantite|qty|qté|nombre|nb)/i,
  variant: /^(variante|variant|option|version|modèle|modele)/i,
  
  // Component patterns
  componentSection: /composant|component|pièce|piece/i,
  supplier: /^(fournisseur|supplier|vendor)/i,
  unitPrice: /^(prix\s*(unitaire)?|pu|price|coût|cout|tarif)/i,
  
  // Material patterns
  materialSection: /matière|matiere|material|raw/i,
  type: /^(type|matière|matiere|material|nature)/i,
  priceKg: /^(prix\s*(kg|kilo)?|€\/kg|eur\/kg)/i,
  quantityKg: /^(quantité|quantite|poids|kg|kilo)/i,
};

// Vérifie si une valeur ressemble à un email
function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Vérifie si une valeur ressemble à un numéro de téléphone
function isPhone(value: string): boolean {
  const cleaned = value.replace(/[\s\.\-\(\)]/g, '');
  return /^(\+?\d{8,15}|0\d{9})$/.test(cleaned);
}

// Vérifie si une valeur ressemble à une adresse
function looksLikeAddress(value: string): boolean {
  // Contient des numéros et des mots typiques d'adresse
  return /\d+.*?(rue|avenue|boulevard|av\.|bd\.|place|allée|chemin|route|impasse|voie|cours|passage|\d{5})/i.test(value);
}

// Extrait les données d'une feuille Excel
function extractDataFromSheet(sheet: XLSX.WorkSheet): ExtractedData {
  const data: ExtractedData = {
    client: {},
    produit: {},
    composants: [],
    matieresPremières: [],
  };

  // Convertir la feuille en tableau 2D
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const rows: (string | number | undefined)[][] = [];
  
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: (string | number | undefined)[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellAddress];
      row.push(cell ? cell.v : undefined);
    }
    rows.push(row);
  }

  // Recherche par en-têtes de colonnes
  const headerRowIndex = findHeaderRow(rows);
  const headers = headerRowIndex >= 0 ? rows[headerRowIndex].map(h => String(h || '').toLowerCase().trim()) : [];
  
  // Map des colonnes par type
  const columnMap: Record<string, number> = {};
  headers.forEach((header, idx) => {
    if (PATTERNS.clientName.test(header)) columnMap['clientName'] = idx;
    if (PATTERNS.address.test(header)) columnMap['address'] = idx;
    if (PATTERNS.email.test(header)) columnMap['email'] = idx;
    if (PATTERNS.phone.test(header)) columnMap['phone'] = idx;
    if (PATTERNS.clientRef.test(header)) columnMap['clientRef'] = idx;
    if (PATTERNS.productName.test(header)) columnMap['productName'] = idx;
    if (PATTERNS.productRef.test(header)) columnMap['productRef'] = idx;
    if (PATTERNS.quantity.test(header)) columnMap['quantity'] = idx;
    if (PATTERNS.variant.test(header)) columnMap['variant'] = idx;
  });

  // Extraire les données de la première ligne de données
  const dataRowIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
  if (dataRowIndex < rows.length) {
    const dataRow = rows[dataRowIndex];
    
    if (columnMap['clientName'] !== undefined) {
      data.client!.nom = String(dataRow[columnMap['clientName']] || '');
    }
    if (columnMap['address'] !== undefined) {
      data.client!.adresse = String(dataRow[columnMap['address']] || '');
    }
    if (columnMap['email'] !== undefined) {
      data.client!.email = String(dataRow[columnMap['email']] || '');
    }
    if (columnMap['phone'] !== undefined) {
      data.client!.telephone = String(dataRow[columnMap['phone']] || '');
    }
    if (columnMap['clientRef'] !== undefined) {
      data.client!.reference = String(dataRow[columnMap['clientRef']] || '');
    }
    if (columnMap['productName'] !== undefined) {
      data.produit!.designation = String(dataRow[columnMap['productName']] || '');
    }
    if (columnMap['productRef'] !== undefined) {
      data.produit!.reference = String(dataRow[columnMap['productRef']] || '');
    }
    if (columnMap['quantity'] !== undefined) {
      const qty = dataRow[columnMap['quantity']];
      data.produit!.quantite = typeof qty === 'number' ? qty : parseInt(String(qty)) || 0;
    }
    if (columnMap['variant'] !== undefined) {
      data.produit!.variantes = String(dataRow[columnMap['variant']] || '');
    }
  }

  // Si pas de headers trouvés, faire une recherche par pattern clé-valeur
  if (Object.keys(columnMap).length === 0) {
    extractFromKeyValuePairs(rows, data);
  }

  // Recherche intelligente pour les valeurs non trouvées
  smartFillMissingData(rows, data);

  return data;
}

// Trouve la ligne d'en-tête probable
function findHeaderRow(rows: (string | number | undefined)[][]): number {
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    const nonEmptyCells = row.filter(cell => cell !== undefined && cell !== '');
    const textCells = nonEmptyCells.filter(cell => typeof cell === 'string' && isNaN(Number(cell)));
    
    // Si la majorité des cellules sont du texte et il y en a plusieurs, c'est probablement l'en-tête
    if (nonEmptyCells.length >= 2 && textCells.length / nonEmptyCells.length > 0.5) {
      // Vérifier si ça ressemble à des en-têtes
      const hasHeaderKeywords = row.some(cell => {
        const str = String(cell || '').toLowerCase();
        return PATTERNS.clientName.test(str) || 
               PATTERNS.productName.test(str) || 
               PATTERNS.quantity.test(str) ||
               PATTERNS.address.test(str);
      });
      if (hasHeaderKeywords) return i;
    }
  }
  return -1;
}

// Extraction à partir de paires clé-valeur (format vertical)
function extractFromKeyValuePairs(rows: (string | number | undefined)[][], data: ExtractedData): void {
  for (const row of rows) {
    if (row.length < 2) continue;
    
    const key = String(row[0] || '').toLowerCase().trim();
    const value = row[1];
    
    if (!key || value === undefined || value === '') continue;
    
    const valueStr = String(value);
    
    // Client
    if (PATTERNS.clientName.test(key)) {
      data.client!.nom = valueStr;
    } else if (PATTERNS.address.test(key)) {
      data.client!.adresse = valueStr;
    } else if (PATTERNS.email.test(key)) {
      data.client!.email = valueStr;
    } else if (PATTERNS.phone.test(key)) {
      data.client!.telephone = valueStr;
    } else if (PATTERNS.clientRef.test(key)) {
      data.client!.reference = valueStr;
    }
    
    // Produit
    if (PATTERNS.productName.test(key)) {
      data.produit!.designation = valueStr;
    } else if (PATTERNS.productRef.test(key)) {
      data.produit!.reference = valueStr;
    } else if (PATTERNS.quantity.test(key)) {
      data.produit!.quantite = typeof value === 'number' ? value : parseInt(valueStr) || 0;
    } else if (PATTERNS.variant.test(key)) {
      data.produit!.variantes = valueStr;
    }
  }
}

// Remplissage intelligent des données manquantes
function smartFillMissingData(rows: (string | number | undefined)[][], data: ExtractedData): void {
  // Parcourir toutes les cellules pour trouver des patterns
  for (const row of rows) {
    for (const cell of row) {
      if (cell === undefined || cell === '') continue;
      const cellStr = String(cell);
      
      // Email non trouvé ?
      if (!data.client?.email && isEmail(cellStr)) {
        data.client!.email = cellStr;
      }
      
      // Téléphone non trouvé ?
      if (!data.client?.telephone && isPhone(cellStr)) {
        data.client!.telephone = cellStr;
      }
      
      // Adresse non trouvée ?
      if (!data.client?.adresse && looksLikeAddress(cellStr)) {
        data.client!.adresse = cellStr;
      }
    }
  }
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
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Prendre la première feuille
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      
      if (!sheet) {
        throw new Error('Feuille Excel vide');
      }

      const extractedData = extractDataFromSheet(sheet);
      
      // Vérifier si des données ont été extraites
      const hasClientData = Object.values(extractedData.client || {}).some(v => v && v !== '');
      const hasProductData = Object.values(extractedData.produit || {}).some(v => v && v !== '' && v !== 0);
      
      if (!hasClientData && !hasProductData) {
        toast({
          title: 'Aucune donnée trouvée',
          description: 'Le fichier ne contient pas de données reconnaissables. Vérifiez le format.',
          variant: 'destructive'
        });
        setIsProcessing(false);
        return;
      }

      onDataExtracted(extractedData);
      
      const extractedFields: string[] = [];
      if (extractedData.client?.nom) extractedFields.push('nom client');
      if (extractedData.client?.adresse) extractedFields.push('adresse');
      if (extractedData.client?.email) extractedFields.push('email');
      if (extractedData.client?.telephone) extractedFields.push('téléphone');
      if (extractedData.produit?.designation) extractedFields.push('produit');
      if (extractedData.produit?.quantite) extractedFields.push('quantité');
      
      toast({
        title: 'Données extraites',
        description: `Champs importés : ${extractedFields.join(', ')}`
      });

    } catch (error) {
      console.error('Erreur import Excel:', error);
      toast({
        title: 'Erreur d\'import',
        description: 'Impossible de lire le fichier Excel',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      // Reset l'input pour permettre de réimporter le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

async function tryFetchOk(url: string, method: 'HEAD' | 'GET') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(url, { method, redirect: 'follow', signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyUrl(url: unknown): Promise<string> {
  const raw = typeof url === 'string' ? url.trim() : '';
  if (!raw) return '';
  if (!/^https?:\/\//i.test(raw)) return '';

  try {
    const head = await tryFetchOk(raw, 'HEAD');
    if (head.ok) return head.url || raw;
  } catch {
    // ignore
  }

  try {
    const get = await tryFetchOk(raw, 'GET');
    if (get.ok) return get.url || raw;
  } catch {
    // ignore
  }

  return '';
}
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productDesignation, type, itemName, quantity } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'full') {
      // Full product suggestions
      const lotQuantity = Math.max(1, Number(quantity) || 1);

      systemPrompt = `Tu es un expert en fabrication industrielle et approvisionnement (marché FR/EU).
Tu dois analyser un produit et proposer:
- composants
- matières premières
- étapes de production

Règles CRITIQUES:
1) Composants & matières premières: donne les quantités PAR UNITÉ (1 produit). Le client multipliera ensuite.
2) Étapes de production: donne dureeHeures pour le LOT COMPLET de ${lotQuantity} unités (incluant réglages + série + contrôle). NE DONNE PAS une durée par unité.
3) Réalisme: évite les durées/coûts absurdes.
4) URLs: ne fournis une URL que si tu es sûr qu'elle pointe vers une page produit réelle. Sinon mets url="".`;

      userPrompt = `Produit: "${productDesignation}"
Quantité du lot: ${lotQuantity}

Donne:
1) Composants (designation, reference, fournisseur, prixUnitaire €, quantite par unité, url)
2) Matières premières (type, fournisseur, prixKg €, quantiteKg par unité, url)
3) Étapes de production (operation, dureeHeures pour le lot complet, tauxHoraire €)

IMPORTANT: Prix plausibles (ordre de grandeur réaliste).`;
    } else if (type === 'component') {
      systemPrompt = `Tu es un expert en sourcing de composants industriels.
Tu dois rechercher des informations de prix pour un composant spécifique.
Fournis des informations réalistes basées sur les prix du marché.
IMPORTANT: L'URL doit être un lien EXACT vers la page produit, pas juste vers le site du fournisseur.`;

      userPrompt = `Recherche le prix actuel du composant "${itemName}".
Trouve:
- Le prix unitaire moyen en euros (prixUnitaire)
- Un fournisseur recommandé (RS Components, Farnell, Mouser, DigiKey, etc.)
- Une URL EXACTE vers la page produit chez ce fournisseur`;
    } else if (type === 'material') {
      systemPrompt = `Tu es un expert en approvisionnement de matières premières industrielles.
Tu dois rechercher des informations de prix pour une matière première spécifique.
Fournis des informations réalistes basées sur les prix du marché.
IMPORTANT: Tu DOIS obligatoirement fournir un prix au kg (prixKg) même si c'est une estimation.`;

      userPrompt = `Recherche le prix actuel de la matière première "${itemName}".
Trouve obligatoirement:
- Le prix au kg en euros (prixKg) - OBLIGATOIRE, donne une estimation si nécessaire
- Un fournisseur recommandé
- Une URL vers le fournisseur ou la fiche produit`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_suggestions',
              description: 'Provide structured suggestions for product manufacturing',
              parameters: {
                type: 'object',
                properties: {
                  composants: {
                    type: 'array',
                    items: {
                      type: 'object',
                        properties: {
                          reference: { type: 'string' },
                          designation: { type: 'string' },
                          fournisseur: { type: 'string' },
                          prixUnitaire: { type: 'number' },
                          quantite: { type: 'number' },
                          url: { type: 'string' },
                        },
                        required: ['reference', 'designation', 'fournisseur', 'prixUnitaire', 'quantite', 'url'],
                    },
                  },
                  matieresPremières: {
                    type: 'array',
                    items: {
                      type: 'object',
                        properties: {
                          type: { type: 'string' },
                          fournisseur: { type: 'string' },
                          prixKg: { type: 'number' },
                          quantiteKg: { type: 'number' },
                          url: { type: 'string' },
                        },
                        required: ['type', 'fournisseur', 'prixKg', 'quantiteKg', 'url'],
                    },
                  },
                  etapesProduction: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        operation: { type: 'string' },
                        dureeHeures: { type: 'number' },
                        tauxHoraire: { type: 'number' },
                      },
                      required: ['operation', 'dureeHeures', 'tauxHoraire'],
                    },
                  },
                  prixUnitaire: { type: 'number' },
                  prixKg: { type: 'number' },
                  fournisseur: { type: 'string' },
                  url: { type: 'string' },
                },
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'provide_suggestions' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte, réessayez dans quelques instants.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits IA insuffisants.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const rawSuggestions = JSON.parse(toolCall.function.arguments);

      // Normalisation + garde-fous + vérification d'URL (on préfère vide plutôt que faux)
      const suggestions: any = { ...rawSuggestions };

      if (Array.isArray(suggestions.composants)) {
        suggestions.composants = await Promise.all(
          suggestions.composants.map(async (c: any) => ({
            ...c,
            prixUnitaire: clamp(Number(c.prixUnitaire) || 0, 0, 1_000),
            quantite: clamp(Number(c.quantite) || 0, 0, 10_000),
            url: await verifyUrl(c.url),
          }))
        );
      }

      if (Array.isArray(suggestions.matieresPremières)) {
        suggestions.matieresPremières = await Promise.all(
          suggestions.matieresPremières.map(async (m: any) => ({
            ...m,
            prixKg: clamp(Number(m.prixKg) || 0, 0, 500),
            quantiteKg: clamp(Number(m.quantiteKg) || 0, 0, 10_000),
            url: await verifyUrl(m.url),
          }))
        );
      }

      if (Array.isArray(suggestions.etapesProduction)) {
        suggestions.etapesProduction = suggestions.etapesProduction.map((e: any) => ({
          ...e,
          // durée pour le lot (pas par unité)
          dureeHeures: clamp(Number(e.dureeHeures) || 0, 0, 80),
          tauxHoraire: clamp(Number(e.tauxHoraire) || 0, 0, 150),
        }));
      }

      // Cas "component" / "material" (structure plate)
      if (suggestions.url) suggestions.url = await verifyUrl(suggestions.url);

      return new Response(
        JSON.stringify({ success: true, suggestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // Fallback to content if no tool call
    const content = data.choices?.[0]?.message?.content;
    return new Response(
      JSON.stringify({ success: true, content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-product-suggestions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

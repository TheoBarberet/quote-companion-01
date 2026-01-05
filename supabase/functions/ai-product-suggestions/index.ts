import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productDesignation, type, itemName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'full') {
      // Full product suggestions
      systemPrompt = `Tu es un expert en fabrication industrielle et approvisionnement pour les produits plastiques.
Tu dois analyser un produit et fournir des suggestions détaillées pour sa fabrication.
Tu dois fournir des informations réalistes basées sur les prix du marché français.`;

      userPrompt = `Pour le produit "${productDesignation}", fournis une analyse complète avec:

1. Les composants nécessaires (électroniques, mécaniques, etc.)
2. Les matières premières (plastiques, métaux, etc.)  
3. Les étapes de production

Pour chaque élément, inclus:
- Une désignation claire
- Un fournisseur suggéré (entreprise réelle française ou européenne)
- Un prix unitaire estimé réaliste
- Une quantité recommandée
- Une URL vers le produit ou le fournisseur (si disponible)`;
    } else if (type === 'component') {
      systemPrompt = `Tu es un expert en sourcing de composants industriels.
Tu dois rechercher des informations de prix pour un composant spécifique.
Fournis des informations réalistes basées sur les prix du marché.`;

      userPrompt = `Recherche le prix actuel du composant "${itemName}".
Trouve:
- Le prix unitaire moyen en euros
- Un ou plusieurs fournisseurs recommandés
- Une URL vers le produit chez un fournisseur`;
    } else if (type === 'material') {
      systemPrompt = `Tu es un expert en approvisionnement de matières premières industrielles.
Tu dois rechercher des informations de prix pour une matière première spécifique.
Fournis des informations réalistes basées sur les prix du marché.`;

      userPrompt = `Recherche le prix actuel de la matière première "${itemName}".
Trouve:
- Le prix au kg en euros
- Un ou plusieurs fournisseurs recommandés
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
                      required: ['designation', 'fournisseur', 'prixUnitaire', 'quantite'],
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
                      required: ['type', 'prixKg', 'quantiteKg'],
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
      const suggestions = JSON.parse(toolCall.function.arguments);
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

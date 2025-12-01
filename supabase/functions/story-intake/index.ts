import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { storyId, storyText, settings } = await req.json()
    
    // Save story to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    await supabase.from('stories').insert({
      id: storyId,
      source_text: storyText,
      settings: settings,
      status: 'queued',
      created_at: new Date().toISOString()
    })

    // Call n8n with ONLY storyId (lightweight payload)
    const n8nWebhook = Deno.env.get('N8N_WEBHOOK_URL')
    const n8nResponse = await fetch(n8nWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyId,
        settings: {
          targetAge: settings.targetAge,
          desiredPageCount: settings.desiredPageCount,
          harshness: settings.harshness,
          aestheticStyle: settings.aestheticStyle,
          heroImage: settings.heroImage
        }
      })
    })

    const result = await n8nResponse.json()
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})


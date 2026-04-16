// Supabase Edge Function: generate-voiceover
//
// Flow:
//   1. Verify the caller is an authenticated Supabase user.
//   2. Call ElevenLabs text-to-speech with the provided text + voice_id.
//   3. Upload the MP3 to the `voiceover` storage bucket (private).
//   4. Create a 1-year signed URL for the uploaded object.
//   5. Update the script row with { voice_id, audio_url }.
//   6. Return { audio_url } to the caller.
//
// Deploy:
//   npx supabase functions deploy generate-voiceover --no-verify-jwt
//
// Required secrets (set via `npx supabase secrets set ...`):
//   - ELEVENLABS_API_KEY
//
// Automatically provided by the Edge Runtime:
//   - SUPABASE_URL
//   - SUPABASE_ANON_KEY
//   - SUPABASE_SERVICE_ROLE_KEY

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const ELEVEN_URL = "https://api.elevenlabs.io/v1/text-to-speech"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: corsHeaders })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return text("Method Not Allowed", 405)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")
  const elevenKey   = Deno.env.get("ELEVENLABS_API_KEY")

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return text("Server missing Supabase env vars", 500)
  }
  if (!elevenKey) {
    return text("Server missing ELEVENLABS_API_KEY secret", 500)
  }

  // Verify caller via their Authorization header.
  const authHeader = req.headers.get("Authorization") ?? ""
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData } = await caller.auth.getUser()
  if (!userData?.user) return text("Unauthorized", 401)

  // Parse body.
  let body: { script_id?: string; text?: string; voice_id?: string }
  try {
    body = await req.json()
  } catch {
    return text("Invalid JSON body", 400)
  }
  const { script_id, text: voText, voice_id } = body
  if (!script_id || !voText || !voice_id) {
    return text("Missing required fields: script_id, text, voice_id", 400)
  }

  // Call ElevenLabs.
  const tts = await fetch(`${ELEVEN_URL}/${voice_id}`, {
    method: "POST",
    headers: {
      "xi-api-key": elevenKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text: voText,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })
  if (!tts.ok) {
    const err = await tts.text()
    return text(`ElevenLabs error ${tts.status}: ${err}`, 502)
  }
  const audio = new Uint8Array(await tts.arrayBuffer())

  // Admin client bypasses RLS for storage + DB writes.
  const admin = createClient(supabaseUrl, serviceKey)

  // Upload to the private `voiceover` bucket. One object per generation, keyed by time.
  const path = `${script_id}/${Date.now()}.mp3`
  const { error: upErr } = await admin.storage
    .from("voiceover")
    .upload(path, audio, { contentType: "audio/mpeg", upsert: true })
  if (upErr) return text(`Storage upload failed: ${upErr.message}`, 500)

  // 1-year signed URL. Regenerate by calling this function again.
  const { data: signed, error: signErr } = await admin.storage
    .from("voiceover")
    .createSignedUrl(path, 60 * 60 * 24 * 365)
  if (signErr || !signed?.signedUrl) {
    return text(`Signed URL failed: ${signErr?.message ?? "unknown"}`, 500)
  }
  const audio_url = signed.signedUrl

  // Persist on the script row.
  const { error: updErr } = await admin
    .from("scripts")
    .update({ voice_id, audio_url })
    .eq("id", script_id)
  if (updErr) return text(`DB update failed: ${updErr.message}`, 500)

  return json({ audio_url })
})

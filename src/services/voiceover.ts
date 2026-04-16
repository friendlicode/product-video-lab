// Thin wrapper around the `generate-voiceover` Supabase Edge Function.
// The function verifies the caller's Supabase session, calls ElevenLabs,
// uploads the resulting MP3 to the `voiceover` storage bucket, writes
// { voice_id, audio_url } back onto the scripts row, and returns the signed URL.

import { supabase } from '@/lib/supabase'

export async function generateVoiceover(
  scriptId: string,
  text: string,
  voiceId: string
): Promise<{ audio_url: string }> {
  const { data, error } = await supabase.functions.invoke('generate-voiceover', {
    body: { script_id: scriptId, text, voice_id: voiceId },
  })
  if (error) throw error
  if (!data?.audio_url) throw new Error('Edge Function returned no audio_url')
  return data as { audio_url: string }
}

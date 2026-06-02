## Remove ElevenLabs from Prep

Scope: strip the "Listen" feature and all ElevenLabs code/keys. No other behavior changes.

### Changes

1. **`src/components/prep/DeepBriefView.tsx`**
   - Remove the "Listen" button, its loading/playing state, and the audio `<audio>`/playback logic.
   - Keep the "Copy" button and the rest of the brief rendering untouched.

2. **`src/lib/prep/elevenlabs.ts`**
   - Delete the file.

3. **`src/components/prep/usePrepSession.ts`** (if it references ElevenLabs)
   - Remove any audio-related state or imports.

4. **Docs / README references**
   - Drop `VITE_ELEVENLABS_API_KEY` from any setup notes in code comments.

### Result

App needs only `VITE_TAVILY_API_KEY` and `VITE_ANTHROPIC_API_KEY`. Deep Diligence view shows Copy only.

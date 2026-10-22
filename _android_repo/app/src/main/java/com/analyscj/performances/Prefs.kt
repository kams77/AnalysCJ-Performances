package com.analyscj.performances

import android.content.Context

/** Réglages de l'application : clés API (chiffrées) et noms de modèles (modifiables). */
class Prefs(context: Context) {
    private val sp = context.getSharedPreferences("analys_cj", Context.MODE_PRIVATE)

    private fun readStr(key: String, def: String): String = sp.getString(key, def) ?: def

    private fun writeStr(key: String, value: String) {
        sp.edit().putString(key, value.trim()).apply()
    }

    /**
     * Lit une clé API chiffrée. Les clés enregistrées par l'ancienne version (en clair)
     * sont automatiquement chiffrées au premier accès.
     */
    private fun readSecret(name: String): String {
        val enc = sp.getString(name + "_enc", "") ?: ""
        if (enc.isNotEmpty()) return SecureStore.decrypt(enc)

        val legacy = sp.getString(name, "") ?: ""
        if (legacy.isNotEmpty()) {
            try {
                sp.edit().putString(name + "_enc", SecureStore.encrypt(legacy)).remove(name).apply()
            } catch (e: Exception) {
                // Keystore indisponible : on garde la clé telle quelle pour ne pas la perdre.
            }
        }
        return legacy
    }

    private fun writeSecret(name: String, value: String) {
        val v = value.trim()
        val editor = sp.edit()
        if (v.isEmpty()) {
            editor.remove(name + "_enc").remove(name)
        } else {
            try {
                editor.putString(name + "_enc", SecureStore.encrypt(v)).remove(name)
            } catch (e: Exception) {
                // Keystore indisponible (rare) : repli sur le stockage privé de l'application.
                editor.putString(name, v).remove(name + "_enc")
            }
        }
        editor.apply()
    }

    // IA d'analyse (Claude) : lit les captures et fait la synthèse finale
    var claudeKey: String
        get() = readSecret("claude_key")
        set(v) { writeSecret("claude_key", v) }

    var claudeModel: String
        get() = readStr("claude_model", DEFAULT_CLAUDE).ifBlank { DEFAULT_CLAUDE }
        set(v) { writeStr("claude_model", v) }

    // IA Big Data n°1 (Gemini) : saison en cours
    var geminiKey: String
        get() = readSecret("gemini_key")
        set(v) { writeSecret("gemini_key", v) }

    var geminiModel: String
        get() = readStr("gemini_model", DEFAULT_GEMINI).ifBlank { DEFAULT_GEMINI }
        set(v) { writeStr("gemini_model", v) }

    // IA Big Data n°2 (OpenAI) : saison passée, joueurs, face-à-face
    var openaiKey: String
        get() = readSecret("openai_key")
        set(v) { writeSecret("openai_key", v) }

    var openaiModel: String
        get() = readStr("openai_model", DEFAULT_OPENAI).ifBlank { DEFAULT_OPENAI }
        set(v) { writeStr("openai_model", v) }

    companion object {
        const val DEFAULT_CLAUDE = "claude-sonnet-5-5"
        const val DEFAULT_GEMINI = "gemini-2.5-flash"
        const val DEFAULT_OPENAI = "gpt-4.1"
    }
}

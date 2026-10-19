package com.analyscj.performances

import android.content.Context

/** Réglages de l'application : clés API et noms de modèles (modifiables). */
class Prefs(context: Context) {
    private val sp = context.getSharedPreferences("analys_cj", Context.MODE_PRIVATE)

    private fun readStr(key: String, def: String): String = sp.getString(key, def) ?: def

    private fun writeStr(key: String, value: String) {
        sp.edit().putString(key, value.trim()).apply()
    }

    // IA d'analyse (Claude) : lit les captures et fait la synthèse finale
    var claudeKey: String
        get() = readStr("claude_key", "")
        set(v) { writeStr("claude_key", v) }

    var claudeModel: String
        get() = readStr("claude_model", DEFAULT_CLAUDE).ifBlank { DEFAULT_CLAUDE }
        set(v) { writeStr("claude_model", v) }

    // IA Big Data n°1 (Gemini) : saison en cours
    var geminiKey: String
        get() = readStr("gemini_key", "")
        set(v) { writeStr("gemini_key", v) }

    var geminiModel: String
        get() = readStr("gemini_model", DEFAULT_GEMINI).ifBlank { DEFAULT_GEMINI }
        set(v) { writeStr("gemini_model", v) }

    // IA Big Data n°2 (OpenAI) : saison passée, joueurs, face-à-face
    var openaiKey: String
        get() = readStr("openai_key", "")
        set(v) { writeStr("openai_key", v) }

    var openaiModel: String
        get() = readStr("openai_model", DEFAULT_OPENAI).ifBlank { DEFAULT_OPENAI }
        set(v) { writeStr("openai_model", v) }

    companion object {
        const val DEFAULT_CLAUDE = "claude-sonnet-5-5"
        const val DEFAULT_GEMINI = "gemini-2.5-flash"
        const val DEFAULT_OPENAI = "gpt-4.1"
    }
}

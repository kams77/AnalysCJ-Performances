package com.analyscj.performances

import java.util.concurrent.Callable
import java.util.concurrent.Executors

/**
 * Pipeline d'analyse :
 *  1. Claude lit les captures (vision) et extrait les informations.
 *  2. Les deux IA Big Data (Gemini et OpenAI) cherchent les données chiffrées, en parallèle.
 *  3. Claude croise tout et produit les pronostics cartons jaunes / corners.
 */
class Analyzer(
    private val prefs: Prefs,
    private val onStatus: (String) -> Unit
) {
    class Result(
        val finalText: String,
        val extraction: String,
        val bigData1: String,
        val bigData2: String,
        val notes: List<String>
    )

    private class Out(val text: String, val error: String?)

    fun run(imagesBase64: List<String>, userContext: String): Result {
        val notes = mutableListOf<String>()

        // Étape 1 : lecture des captures
        onStatus("1/3 · Claude lit vos captures…")
        val extraction = ClaudeClient.call(
            apiKey = prefs.claudeKey,
            model = prefs.claudeModel,
            system = Prompts.SYSTEM_ANALYSTE,
            userText = Prompts.extraction(userContext),
            imagesBase64 = imagesBase64,
            maxTokens = 4096
        )

        // Étape 2 : Big Data en parallèle
        onStatus("2/3 · Les IA Big Data collectent les statistiques…")
        val pool = Executors.newFixedThreadPool(2)
        val f1 = pool.submit(Callable<Out> {
            if (prefs.geminiKey.isBlank()) {
                Out("", "Big Data n°1 (Gemini) non configurée : clé manquante dans les réglages.")
            } else {
                try {
                    Out(GeminiClient.call(prefs.geminiKey, prefs.geminiModel, Prompts.bigData1(extraction)), null)
                } catch (e: Exception) {
                    Out("", "Big Data n°1 (Gemini) : ${e.message}")
                }
            }
        })
        val f2 = pool.submit(Callable<Out> {
            if (prefs.openaiKey.isBlank()) {
                Out("", "Big Data n°2 (OpenAI) non configurée : clé manquante dans les réglages.")
            } else {
                try {
                    Out(OpenAiClient.call(prefs.openaiKey, prefs.openaiModel, Prompts.bigData2(extraction)), null)
                } catch (e: Exception) {
                    Out("", "Big Data n°2 (OpenAI) : ${e.message}")
                }
            }
        })
        val bd1 = f1.get()
        val bd2 = f2.get()
        pool.shutdown()
        bd1.error?.let { notes.add(it) }
        bd2.error?.let { notes.add(it) }

        // Étape 3 : analyse finale
        onStatus("3/3 · Claude croise les sources et calcule les probabilités…")
        val finalText = ClaudeClient.call(
            apiKey = prefs.claudeKey,
            model = prefs.claudeModel,
            system = Prompts.SYSTEM_ANALYSTE,
            userText = Prompts.finale(extraction, bd1.text, bd2.text, userContext),
            imagesBase64 = emptyList(),
            maxTokens = 4096
        )

        return Result(finalText, extraction, bd1.text, bd2.text, notes)
    }
}

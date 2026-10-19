package com.analyscj.performances

import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class AiException(message: String) : Exception(message)

object Http {
    /** Envoie un POST JSON et renvoie (code HTTP, corps de la réponse). */
    fun postJson(
        urlStr: String,
        headers: Map<String, String>,
        body: String,
        readTimeoutMs: Int = 180000
    ): Pair<Int, String> {
        val conn = URL(urlStr).openConnection() as HttpURLConnection
        try {
            conn.requestMethod = "POST"
            conn.connectTimeout = 30000
            conn.readTimeout = readTimeoutMs
            conn.doOutput = true
            conn.setRequestProperty("Content-Type", "application/json")
            for ((k, v) in headers) conn.setRequestProperty(k, v)
            conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
            return Pair(code, text)
        } finally {
            conn.disconnect()
        }
    }

    /** Extrait le message d'erreur d'une réponse JSON d'API (format {"error":{"message":...}}). */
    fun errorMessage(body: String): String {
        return try {
            val err = JSONObject(body).opt("error")
            when (err) {
                is JSONObject -> err.optString("message", body)
                is String -> err
                else -> body
            }.take(400)
        } catch (e: Exception) {
            body.take(400)
        }
    }
}

/** Claude : lecture des captures (vision) et analyse finale. */
object ClaudeClient {
    fun call(
        apiKey: String,
        model: String,
        system: String,
        userText: String,
        imagesBase64: List<String>,
        maxTokens: Int = 4096
    ): String {
        val content = JSONArray()
        for (b64 in imagesBase64) {
            val source = JSONObject()
                .put("type", "base64")
                .put("media_type", "image/jpeg")
                .put("data", b64)
            content.put(JSONObject().put("type", "image").put("source", source))
        }
        content.put(JSONObject().put("type", "text").put("text", userText))

        val message = JSONObject().put("role", "user").put("content", content)
        val body = JSONObject()
            .put("model", model)
            .put("max_tokens", maxTokens)
            .put("system", system)
            .put("messages", JSONArray().put(message))

        val headers = mapOf("x-api-key" to apiKey, "anthropic-version" to "2023-06-01")
        val (code, text) = Http.postJson("https://api.anthropic.com/v1/messages", headers, body.toString())
        if (code !in 200..299) throw AiException("Claude (HTTP $code) : ${Http.errorMessage(text)}")

        val arr = JSONObject(text).optJSONArray("content") ?: throw AiException("Claude : réponse vide")
        val sb = StringBuilder()
        for (i in 0 until arr.length()) {
            val block = arr.getJSONObject(i)
            if (block.optString("type") == "text") sb.append(block.optString("text"))
        }
        return sb.toString().trim()
    }
}

/** IA Big Data n°1 : Gemini, avec recherche Google si le modèle l'accepte. */
object GeminiClient {
    fun call(apiKey: String, model: String, prompt: String): String {
        fun once(withSearch: Boolean): Pair<Int, String> {
            val part = JSONObject().put("text", prompt)
            val contents = JSONArray().put(JSONObject().put("parts", JSONArray().put(part)))
            val body = JSONObject().put("contents", contents)
            if (withSearch) {
                body.put("tools", JSONArray().put(JSONObject().put("google_search", JSONObject())))
            }
            return Http.postJson(
                "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent",
                mapOf("x-goog-api-key" to apiKey),
                body.toString()
            )
        }

        var result = once(true)
        if (result.first == 400) result = once(false) // modèle sans recherche web : on réessaie sans
        val (code, text) = result
        if (code !in 200..299) throw AiException("Gemini (HTTP $code) : ${Http.errorMessage(text)}")

        val candidates = JSONObject(text).optJSONArray("candidates")
        if (candidates == null || candidates.length() == 0) throw AiException("Gemini : aucune réponse")
        val parts = candidates.getJSONObject(0).optJSONObject("content")?.optJSONArray("parts")
            ?: throw AiException("Gemini : réponse vide")
        val sb = StringBuilder()
        for (i in 0 until parts.length()) sb.append(parts.getJSONObject(i).optString("text"))
        return sb.toString().trim()
    }
}

/** IA Big Data n°2 : OpenAI (API Responses), avec recherche web si le modèle l'accepte. */
object OpenAiClient {
    fun call(apiKey: String, model: String, prompt: String): String {
        fun once(withSearch: Boolean): Pair<Int, String> {
            val body = JSONObject().put("model", model).put("input", prompt)
            if (withSearch) {
                body.put("tools", JSONArray().put(JSONObject().put("type", "web_search")))
            }
            return Http.postJson(
                "https://api.openai.com/v1/responses",
                mapOf("Authorization" to "Bearer $apiKey"),
                body.toString()
            )
        }

        var result = once(true)
        if (result.first == 400) result = once(false) // modèle sans recherche web : on réessaie sans
        val (code, text) = result
        if (code !in 200..299) throw AiException("OpenAI (HTTP $code) : ${Http.errorMessage(text)}")

        val output = JSONObject(text).optJSONArray("output") ?: throw AiException("OpenAI : réponse vide")
        val sb = StringBuilder()
        for (i in 0 until output.length()) {
            val item = output.getJSONObject(i)
            if (item.optString("type") != "message") continue
            val content = item.optJSONArray("content") ?: continue
            for (j in 0 until content.length()) {
                val c = content.getJSONObject(j)
                if (c.optString("type") == "output_text") sb.append(c.optString("text"))
            }
        }
        val out = sb.toString().trim()
        if (out.isEmpty()) throw AiException("OpenAI : aucun texte dans la réponse")
        return out
    }
}

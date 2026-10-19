package com.analyscj.performances

import org.json.JSONArray
import org.json.JSONObject

class Pick(
    val marche: String,
    val cible: String,
    val selection: String,
    val probabilite: Double,
    val justification: String,
    val facteurs: List<String>
)

class Parsed(
    val home: String,
    val away: String,
    val comp: String,
    val date: String,
    val quality: String,
    val picks: List<Pick>,
    val synthese: String,
    val missing: List<String>
)

/** Lecture de la réponse JSON de Claude, partagée par l'écran de résultat, l'historique et le partage. */
object ResultParser {

    fun extractJson(text: String): JSONObject? {
        val start = text.indexOf('{')
        val end = text.lastIndexOf('}')
        if (start < 0 || end <= start) return null
        return try {
            JSONObject(text.substring(start, end + 1))
        } catch (e: Exception) {
            null
        }
    }

    private fun stringList(arr: JSONArray?): List<String> {
        if (arr == null) return emptyList()
        val out = mutableListOf<String>()
        for (i in 0 until arr.length()) {
            val s = arr.optString(i, "")
            if (s.isNotBlank()) out.add(s)
        }
        return out
    }

    /** Renvoie null si la réponse n'est pas au format attendu. Les pronostics sont triés du plus probable au moins probable. */
    fun parse(finalText: String): Parsed? {
        val root = extractJson(finalText) ?: return null
        val match = root.optJSONObject("match")

        val picks = mutableListOf<Pick>()
        val arr = root.optJSONArray("pronostics")
        if (arr != null) {
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                var p = o.optDouble("probabilite", 0.0)
                if (p in 0.0..1.0) p *= 100.0
                picks.add(
                    Pick(
                        o.optString("marche"),
                        o.optString("cible"),
                        o.optString("selection"),
                        p,
                        o.optString("justification"),
                        stringList(o.optJSONArray("facteurs"))
                    )
                )
            }
        }
        picks.sortByDescending { it.probabilite }

        return Parsed(
            home = match?.optString("domicile", "") ?: "",
            away = match?.optString("exterieur", "") ?: "",
            comp = match?.optString("competition", "") ?: "",
            date = match?.optString("date", "") ?: "",
            quality = root.optString("qualite_donnees", "partielle"),
            picks = picks,
            synthese = root.optString("synthese", ""),
            missing = stringList(root.optJSONArray("donnees_manquantes"))
        )
    }

    /** Un pronostic n'est « fiable » que si sa probabilité atteint 90 % et que les données ne sont pas jugées faibles. */
    fun isSure(p: Pick, quality: String): Boolean = p.probabilite >= 90.0 && quality != "faible"

    fun marketLabel(p: Pick): String = if (p.marche == "corners") "⛳ Corners" else "🟨 Cartons jaunes"

    fun targetLabel(p: Pick): String = when (p.cible) {
        "domicile" -> "domicile"
        "exterieur" -> "extérieur"
        else -> "match"
    }

    fun title(p: Parsed): String =
        if (p.home.isNotBlank() || p.away.isNotBlank()) "${p.home} vs ${p.away}" else "Match analysé"

    /** Texte prêt à être partagé ou copié. */
    fun shareText(p: Parsed): String {
        val sb = StringBuilder()
        sb.append("Analys C&J Performances\n")
        sb.append(title(p)).append('\n')
        val sub = listOf(p.comp, p.date).filter { it.isNotBlank() }.joinToString(" · ")
        if (sub.isNotBlank()) sb.append(sub).append('\n')
        sb.append('\n')
        for (pick in p.picks) {
            val flag = if (isSure(pick, p.quality)) "✅" else "⚠"
            sb.append("$flag ${marketLabel(pick)} (${targetLabel(pick)}) : ${pick.selection} — ${pick.probabilite.toInt()} %\n")
        }
        if (p.picks.none { isSure(it, p.quality) }) {
            sb.append("\nAucun pronostic n'atteint 90 %.\n")
        }
        if (p.synthese.isNotBlank()) sb.append('\n').append(p.synthese).append('\n')
        sb.append("\nEstimations statistiques par IA, sans garantie. Les paris comportent un risque de perte (18+).")
        return sb.toString()
    }
}

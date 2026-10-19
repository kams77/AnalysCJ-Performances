package com.analyscj.performances

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/** Une analyse enregistrée. outcomes : numéro du pronostic -> 1 (réussi), -1 (raté), absent ou 0 (pas encore noté). */
class Entry(
    val id: Long,
    val ts: Long,
    val title: String,
    val finalText: String,
    val extraction: String,
    val bigData1: String,
    val bigData2: String,
    val notes: List<String>,
    val outcomes: MutableMap<Int, Int>
) {
    fun toJson(): JSONObject {
        val oc = JSONObject()
        for ((k, v) in outcomes) oc.put(k.toString(), v)
        return JSONObject()
            .put("id", id)
            .put("ts", ts)
            .put("title", title)
            .put("finalText", finalText)
            .put("extraction", extraction)
            .put("bigData1", bigData1)
            .put("bigData2", bigData2)
            .put("notes", JSONArray(notes))
            .put("outcomes", oc)
    }

    companion object {
        fun fromJson(o: JSONObject): Entry {
            val notes = mutableListOf<String>()
            val na = o.optJSONArray("notes")
            if (na != null) {
                for (i in 0 until na.length()) notes.add(na.optString(i))
            }
            val outcomes = mutableMapOf<Int, Int>()
            val oj = o.optJSONObject("outcomes")
            if (oj != null) {
                val keys = oj.keys()
                while (keys.hasNext()) {
                    val k = keys.next()
                    val idx = k.toIntOrNull() ?: continue
                    outcomes[idx] = oj.optInt(k, 0)
                }
            }
            return Entry(
                id = o.optLong("id"),
                ts = o.optLong("ts"),
                title = o.optString("title", "Analyse"),
                finalText = o.optString("finalText"),
                extraction = o.optString("extraction"),
                bigData1 = o.optString("bigData1"),
                bigData2 = o.optString("bigData2"),
                notes = notes,
                outcomes = outcomes
            )
        }
    }
}

class Stats(
    val rated: Int,
    val won: Int,
    val sureRated: Int,
    val sureWon: Int,
    val avgPredicted: Double
)

object History {
    private const val FILE = "history.json"
    private const val MAX_ENTRIES = 100

    @Synchronized
    fun load(ctx: Context): MutableList<Entry> {
        val f = File(ctx.filesDir, FILE)
        val out = mutableListOf<Entry>()
        if (!f.exists()) return out
        try {
            val arr = JSONArray(f.readText(Charsets.UTF_8))
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                out.add(Entry.fromJson(o))
            }
        } catch (e: Exception) {
            // fichier illisible : on repart d'un historique vide
        }
        return out
    }

    @Synchronized
    private fun save(ctx: Context, list: List<Entry>) {
        val arr = JSONArray()
        for (e in list.take(MAX_ENTRIES)) arr.put(e.toJson())
        File(ctx.filesDir, FILE).writeText(arr.toString(), Charsets.UTF_8)
    }

    @Synchronized
    fun add(ctx: Context, entry: Entry) {
        val list = load(ctx)
        list.add(0, entry)
        save(ctx, list)
    }

    @Synchronized
    fun updateOutcomes(ctx: Context, id: Long, outcomes: Map<Int, Int>) {
        val list = load(ctx)
        val target = list.firstOrNull { it.id == id } ?: return
        target.outcomes.clear()
        target.outcomes.putAll(outcomes)
        save(ctx, list)
    }

    @Synchronized
    fun clear(ctx: Context) {
        File(ctx.filesDir, FILE).delete()
    }

    /** Bilan calculé uniquement sur les pronostics que vous avez notés « réussi » ou « raté ». */
    fun stats(list: List<Entry>): Stats {
        var rated = 0
        var won = 0
        var sureRated = 0
        var sureWon = 0
        var sum = 0.0
        for (e in list) {
            val parsed = ResultParser.parse(e.finalText) ?: continue
            for ((idx, outcome) in e.outcomes) {
                if (outcome == 0 || idx < 0 || idx >= parsed.picks.size) continue
                val pick = parsed.picks[idx]
                rated++
                sum += pick.probabilite
                if (outcome == 1) won++
                if (ResultParser.isSure(pick, parsed.quality)) {
                    sureRated++
                    if (outcome == 1) sureWon++
                }
            }
        }
        return Stats(rated, won, sureRated, sureWon, if (rated > 0) sum / rated else 0.0)
    }
}

package com.analyscj.performances

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : Activity() {

    private val bg = Color.parseColor("#0F172A")
    private val card = Color.parseColor("#1E293B")
    private val textMain = Color.parseColor("#E2E8F0")
    private val textMuted = Color.parseColor("#94A3B8")
    private val green = Color.parseColor("#22C55E")
    private val amber = Color.parseColor("#F59E0B")
    private val yellow = Color.parseColor("#FACC15")
    private val red = Color.parseColor("#EF4444")

    private lateinit var prefs: Prefs
    private val shots = mutableListOf<ImageUtils.Shot>()

    private lateinit var thumbRow: LinearLayout
    private lateinit var countText: TextView
    private lateinit var contextInput: EditText
    private lateinit var analyzeBtn: Button
    private lateinit var statusText: TextView
    private lateinit var resultBox: LinearLayout

    @Volatile
    private var running = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = Prefs(this)
        window.statusBarColor = bg
        window.navigationBarColor = bg
        buildUi()
        refreshThumbs()
    }

    // ---------------------------------------------------------------- UI

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()

    private fun roundBg(color: Int, radiusDp: Int): GradientDrawable =
        GradientDrawable().apply {
            setColor(color)
            cornerRadius = dp(radiusDp).toFloat()
        }

    private fun label(text: String, size: Float = 14f, color: Int = textMain, bold: Boolean = false): TextView =
        TextView(this).apply {
            this.text = text
            textSize = size
            setTextColor(color)
            if (bold) setTypeface(typeface, Typeface.BOLD)
        }

    private fun button(text: String, color: Int, textColor: Int = Color.WHITE): Button =
        Button(this).apply {
            this.text = text
            setAllCaps(false)
            setTextColor(textColor)
            background = roundBg(color, 12)
            setPadding(dp(16), dp(12), dp(16), dp(12))
        }

    private fun cardBox(): LinearLayout =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = roundBg(card, 14)
            setPadding(dp(14), dp(12), dp(14), dp(12))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dp(10) }
        }

    private fun buildUi() {
        val scroll = ScrollView(this).apply { setBackgroundColor(bg) }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(24), dp(16), dp(32))
        }
        scroll.addView(root)

        // En-tête
        val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val titles = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }
        titles.addView(label("Analys C&J Performances", 22f, yellow, true))
        titles.addView(label("Cartons jaunes · Corners", 13f, textMuted))
        val settingsBtn = button("⚙ Réglages", card, textMain)
        settingsBtn.setOnClickListener { showSettings() }
        header.addView(titles)
        header.addView(settingsBtn)
        root.addView(header)

        // Captures
        val capCard = cardBox()
        capCard.addView(label("1. Captures du match", 16f, textMain, true))
        capCard.addView(
            label(
                "Ajoutez les captures d'écran des informations du match (statistiques, classement, forme, joueurs, blessés, arbitre…).",
                13f, textMuted
            )
        )
        val addBtn = button("＋ Ajouter des captures", Color.parseColor("#334155"))
        addBtn.setOnClickListener { pickImages() }
        capCard.addView(addBtn, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(10) })
        countText = label("", 13f, textMuted)
        capCard.addView(countText)
        val hs = HorizontalScrollView(this)
        thumbRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        hs.addView(thumbRow)
        capCard.addView(hs)
        root.addView(capCard)

        // Contexte
        val ctxCard = cardBox()
        ctxCard.addView(label("2. Précision (facultatif)", 16f, textMain, true))
        contextInput = EditText(this).apply {
            hint = "Ex. : Ligue 1, PSG – Marseille, arbitre X…"
            setHintTextColor(textMuted)
            setTextColor(textMain)
            textSize = 14f
            minLines = 2
        }
        ctxCard.addView(contextInput)
        root.addView(ctxCard)

        // Lancer
        analyzeBtn = button("Lancer l'analyse", Color.parseColor("#16A34A"))
        analyzeBtn.textSize = 16f
        analyzeBtn.setOnClickListener { startAnalysis() }
        root.addView(analyzeBtn, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(14) })

        statusText = label("", 13f, amber)
        statusText.gravity = Gravity.CENTER
        root.addView(statusText, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(8) })

        resultBox = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        root.addView(resultBox)

        setContentView(scroll)
    }

    private fun refreshThumbs() {
        thumbRow.removeAllViews()
        val snapshot = synchronized(shots) { shots.toList() }
        countText.text = if (snapshot.isEmpty()) "Aucune capture ajoutée" else "${snapshot.size} capture(s) prête(s) (max. $MAX_SHOTS)"
        for (shot in snapshot) {
            val cell = FrameLayout(this)
            val img = ImageView(this).apply {
                setImageBitmap(shot.thumb)
                scaleType = ImageView.ScaleType.CENTER_CROP
            }
            cell.addView(img, FrameLayout.LayoutParams(dp(90), dp(130)))
            val close = TextView(this).apply {
                text = "✕"
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
                background = roundBg(red, 12)
                setOnClickListener {
                    synchronized(shots) { shots.remove(shot) }
                    refreshThumbs()
                }
            }
            cell.addView(close, FrameLayout.LayoutParams(dp(24), dp(24), Gravity.TOP or Gravity.END))
            thumbRow.addView(cell, LinearLayout.LayoutParams(dp(94), dp(134)).apply {
                topMargin = dp(8)
                rightMargin = dp(4)
            })
        }
    }

    // --------------------------------------------------------- Captures

    private fun pickImages() {
        if (shots.size >= MAX_SHOTS) {
            Toast.makeText(this, "Maximum $MAX_SHOTS captures.", Toast.LENGTH_SHORT).show()
            return
        }
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "image/*"
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
        }
        startActivityForResult(Intent.createChooser(intent, "Choisir les captures"), REQ_PICK)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQ_PICK || resultCode != RESULT_OK || data == null) return

        val uris = mutableListOf<android.net.Uri>()
        val clip = data.clipData
        if (clip != null) {
            for (i in 0 until clip.itemCount) uris.add(clip.getItemAt(i).uri)
        } else {
            data.data?.let { uris.add(it) }
        }

        statusText.text = "Chargement des captures…"
        Thread {
            var added = 0
            var failed = 0
            for (uri in uris) {
                if (shots.size >= MAX_SHOTS) break
                val shot = try {
                    ImageUtils.load(this, uri)
                } catch (e: Exception) {
                    null
                }
                if (shot != null) {
                    synchronized(shots) { shots.add(shot) }
                    added++
                } else {
                    failed++
                }
            }
            runOnUiThread {
                statusText.text = ""
                refreshThumbs()
                if (failed > 0) {
                    Toast.makeText(this, "$failed image(s) illisible(s).", Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    // --------------------------------------------------------- Réglages

    private fun showSettings() {
        val pad = dp(16)
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(pad, pad, pad, pad)
        }

        fun field(title: String, value: String, secret: Boolean): EditText {
            box.addView(label(title, 13f, textMain, true), LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dp(10) })
            val et = EditText(this).apply {
                setText(value)
                setTextColor(textMain)
                textSize = 13f
                setSingleLine(true)
                inputType = if (secret)
                    InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
                else
                    InputType.TYPE_CLASS_TEXT
            }
            box.addView(et)
            return et
        }

        box.addView(label("IA d'analyse · Claude (lit les captures et fait la synthèse)", 14f, yellow, true))
        val claudeKey = field("Clé API Claude (obligatoire)", prefs.claudeKey, true)
        val claudeModel = field("Modèle Claude", prefs.claudeModel, false)

        box.addView(label("IA Big Data n°1 · Gemini (saison en cours)", 14f, yellow, true), LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(20) })
        val geminiKey = field("Clé API Gemini", prefs.geminiKey, true)
        val geminiModel = field("Modèle Gemini", prefs.geminiModel, false)

        box.addView(label("IA Big Data n°2 · OpenAI (saison passée, joueurs)", 14f, yellow, true), LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(20) })
        val openaiKey = field("Clé API OpenAI", prefs.openaiKey, true)
        val openaiModel = field("Modèle OpenAI", prefs.openaiModel, false)

        box.addView(
            label(
                "Les clés sont stockées uniquement sur ce téléphone et envoyées seulement au service concerné. Si un nom de modèle est refusé, remplacez-le par un modèle disponible sur votre compte.",
                12f, textMuted
            ), LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dp(16) }
        )

        val sv = ScrollView(this).apply {
            setBackgroundColor(card)
            addView(box)
        }

        AlertDialog.Builder(this)
            .setTitle("Réglages")
            .setView(sv)
            .setPositiveButton("Enregistrer") { _, _ ->
                prefs.claudeKey = claudeKey.text.toString()
                prefs.claudeModel = claudeModel.text.toString()
                prefs.geminiKey = geminiKey.text.toString()
                prefs.geminiModel = geminiModel.text.toString()
                prefs.openaiKey = openaiKey.text.toString()
                prefs.openaiModel = openaiModel.text.toString()
                Toast.makeText(this, "Réglages enregistrés.", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Annuler", null)
            .show()
    }

    // --------------------------------------------------------- Analyse

    private fun startAnalysis() {
        if (running) return
        if (shots.isEmpty()) {
            Toast.makeText(this, "Ajoutez d'abord au moins une capture.", Toast.LENGTH_LONG).show()
            return
        }
        if (prefs.claudeKey.isBlank()) {
            Toast.makeText(this, "Saisissez votre clé API Claude dans les réglages.", Toast.LENGTH_LONG).show()
            showSettings()
            return
        }

        running = true
        analyzeBtn.isEnabled = false
        analyzeBtn.alpha = 0.5f
        resultBox.removeAllViews()
        val ctx = contextInput.text.toString().trim()
        val images = synchronized(shots) { shots.map { it.base64 } }

        Thread {
            try {
                val result = Analyzer(prefs) { msg -> runOnUiThread { statusText.text = msg } }
                    .run(images, ctx)
                runOnUiThread {
                    statusText.text = ""
                    renderResult(result)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    statusText.text = ""
                    showError(e.message ?: e.toString())
                }
            } finally {
                runOnUiThread {
                    running = false
                    analyzeBtn.isEnabled = true
                    analyzeBtn.alpha = 1f
                }
            }
        }.start()
    }

    private fun showError(message: String) {
        val c = cardBox()
        c.addView(label("Analyse impossible", 16f, red, true))
        c.addView(label(message, 13f, textMain))
        resultBox.addView(c)
    }

    // --------------------------------------------------------- Résultats

    private fun extractJson(text: String): JSONObject? {
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

    private class Pick(
        val marche: String,
        val cible: String,
        val selection: String,
        val probabilite: Double,
        val justification: String,
        val facteurs: List<String>
    )

    private fun renderResult(res: Analyzer.Result) {
        resultBox.removeAllViews()

        val root = extractJson(res.finalText)
        if (root == null) {
            val c = cardBox()
            c.addView(label("Réponse de Claude (format inattendu)", 16f, amber, true))
            c.addView(label(res.finalText, 13f, textMain))
            resultBox.addView(c)
            addDetails(res)
            return
        }

        val match = root.optJSONObject("match")
        val home = match?.optString("domicile", "") ?: ""
        val away = match?.optString("exterieur", "") ?: ""
        val comp = match?.optString("competition", "") ?: ""
        val date = match?.optString("date", "") ?: ""
        val quality = root.optString("qualite_donnees", "partielle")

        val picks = mutableListOf<Pick>()
        val arr = root.optJSONArray("pronostics")
        if (arr != null) {
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                var p = o.optDouble("probabilite", 0.0)
                if (p in 0.0..1.0) p *= 100.0
                picks.add(
                    Pick(
                        o.optString("marche"), o.optString("cible"), o.optString("selection"),
                        p, o.optString("justification"), stringList(o.optJSONArray("facteurs"))
                    )
                )
            }
        }
        picks.sortByDescending { it.probabilite }

        // Carte match
        val head = cardBox()
        val title = if (home.isNotBlank() || away.isNotBlank()) "$home  vs  $away" else "Match analysé"
        head.addView(label(title, 18f, textMain, true))
        val sub = listOf(comp, date).filter { it.isNotBlank() }.joinToString(" · ")
        if (sub.isNotBlank()) head.addView(label(sub, 13f, textMuted))
        val qColor = when (quality) {
            "bonne" -> green
            "faible" -> red
            else -> amber
        }
        head.addView(label("Qualité des données : $quality", 13f, qColor, true))
        resultBox.addView(head)

        // Alertes sur les sources
        if (res.notes.isNotEmpty()) {
            val c = cardBox()
            c.addView(label("⚠ Sources indisponibles", 14f, amber, true))
            for (n in res.notes) c.addView(label("• $n", 12f, textMain))
            c.addView(label("Sans les deux IA Big Data, la fiabilité des pronostics est réduite.", 12f, textMuted))
            resultBox.addView(c)
        }

        // Bandeau 90 %
        val reliable = picks.filter { it.probabilite >= 90.0 && quality != "faible" }
        val banner = cardBox()
        if (reliable.isEmpty()) {
            banner.addView(label("Aucun pronostic n'atteint 90 %", 16f, amber, true))
            banner.addView(
                label(
                    "Les cartons et les corners sont très variables. Plutôt que d'afficher un faux 90 %, l'application indique ici qu'aucune sélection n'est assez solide pour ce match. Ajoutez des captures plus complètes pour améliorer l'analyse.",
                    13f, textMain
                )
            )
        } else {
            banner.addView(label("✅ ${reliable.size} pronostic(s) à 90 % ou plus", 16f, green, true))
        }
        resultBox.addView(banner)

        // Pronostics
        for (p in picks) {
            val sure = p.probabilite >= 90.0 && quality != "faible"
            val c = cardBox()
            val icon = if (p.marche == "corners") "⛳ Corners" else "🟨 Cartons jaunes"
            val target = when (p.cible) {
                "domicile" -> "domicile"
                "exterieur" -> "extérieur"
                else -> "match"
            }
            c.addView(label("$icon · $target", 13f, textMuted))
            c.addView(label(p.selection, 20f, textMain, true))
            c.addView(label("Probabilité estimée : ${p.probabilite.toInt()} %", 15f, if (sure) green else amber, true))
            c.addView(
                label(
                    if (sure) "✅ Niveau ≥ 90 %" else "⚠ Sous 90 % : confiance insuffisante, pas de pari conseillé",
                    12f, if (sure) green else amber
                )
            )
            if (p.justification.isNotBlank()) c.addView(label(p.justification, 13f, textMain))
            for (f in p.facteurs) c.addView(label("• $f", 12f, textMuted))
            resultBox.addView(c)
        }

        // Synthèse
        val synth = root.optString("synthese", "")
        if (synth.isNotBlank()) {
            val c = cardBox()
            c.addView(label("🔎 Synthèse", 15f, textMain, true))
            c.addView(label(synth, 13f, textMain))
            resultBox.addView(c)
        }

        // Données manquantes
        val missing = stringList(root.optJSONArray("donnees_manquantes"))
        if (missing.isNotEmpty()) {
            val c = cardBox()
            c.addView(label("Données manquantes", 15f, amber, true))
            for (m in missing) c.addView(label("• $m", 12f, textMain))
            resultBox.addView(c)
        }

        addDetails(res)

        val warn = cardBox()
        warn.addView(
            label(
                "Ces résultats sont des estimations statistiques produites par des IA : aucune garantie de résultat. Les paris comportent un risque de perte, réservés aux personnes majeures. Ne misez jamais plus que ce que vous pouvez perdre.",
                12f, textMuted
            )
        )
        resultBox.addView(warn)
    }

    private fun addDetails(res: Analyzer.Result) {
        addCollapsible("Détail · Lecture des captures (Claude)", res.extraction)
        addCollapsible("Détail · Big Data n°1 (Gemini)", res.bigData1)
        addCollapsible("Détail · Big Data n°2 (OpenAI)", res.bigData2)
    }

    private fun addCollapsible(title: String, content: String) {
        val c = cardBox()
        val head = label("▸ $title", 14f, textMain, true)
        val body = label(content.ifBlank { "Aucune donnée (IA non configurée ou en erreur)." }, 12f, textMuted)
        body.visibility = View.GONE
        head.setOnClickListener {
            val open = body.visibility == View.VISIBLE
            body.visibility = if (open) View.GONE else View.VISIBLE
            head.text = (if (open) "▸ " else "▾ ") + title
        }
        c.addView(head)
        c.addView(body)
        resultBox.addView(c)
    }

    companion object {
        private const val REQ_PICK = 1001
        private const val MAX_SHOTS = 8
    }
}

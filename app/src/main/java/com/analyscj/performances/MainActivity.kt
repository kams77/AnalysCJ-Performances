package com.analyscj.performances

import android.app.Activity
import android.app.AlertDialog
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.roundToInt

class MainActivity : Activity() {

    private val bg = Color.parseColor("#0F172A")
    private val card = Color.parseColor("#1E293B")
    private val chip = Color.parseColor("#334155")
    private val textMain = Color.parseColor("#E2E8F0")
    private val textMuted = Color.parseColor("#94A3B8")
    private val green = Color.parseColor("#22C55E")
    private val amber = Color.parseColor("#F59E0B")
    private val yellow = Color.parseColor("#FACC15")
    private val red = Color.parseColor("#EF4444")

    private lateinit var prefs: Prefs
    private val shots = mutableListOf<ImageUtils.Shot>()

    private lateinit var scrollView: ScrollView
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

    private fun matchWrap(top: Int = 0): LinearLayout.LayoutParams =
        LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply { topMargin = dp(top) }

    private fun buildUi() {
        scrollView = ScrollView(this).apply { setBackgroundColor(bg) }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(24), dp(16), dp(32))
        }
        scrollView.addView(root)

        // En-tête
        val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val titles = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }
        titles.addView(label("Analys C&J Performances", 22f, yellow, true))
        titles.addView(label("Cartons jaunes · Corners", 13f, textMuted))
        val historyBtn = button("📚", card, textMain)
        historyBtn.setOnClickListener { showHistory() }
        val settingsBtn = button("⚙", card, textMain)
        settingsBtn.setOnClickListener { showSettings() }
        header.addView(titles)
        header.addView(historyBtn)
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
        val addBtn = button("＋ Ajouter des captures", chip)
        addBtn.setOnClickListener { pickImages() }
        capCard.addView(addBtn, matchWrap(10))
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
        root.addView(analyzeBtn, matchWrap(14))

        statusText = label("", 13f, amber)
        statusText.gravity = Gravity.CENTER
        root.addView(statusText, matchWrap(8))

        resultBox = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        root.addView(resultBox)

        setContentView(scrollView)
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

        val uris = mutableListOf<Uri>()
        val clip = data.clipData
        if (clip != null) {
            for (i in 0 until clip.itemCount) uris.add(clip.getItemAt(i).uri)
        } else {
            data.data?.let { uris.add(it) }
        }

        statusText.text = "Chargement des captures…"
        Thread {
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

    private fun testOne(key: String, block: () -> String): String {
        if (key.isBlank()) return "— clé non renseignée"
        return try {
            block()
            "✅ connexion OK"
        } catch (e: Exception) {
            "❌ ${e.message}"
        }
    }

    private fun showSettings() {
        val pad = dp(16)
        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(pad, pad, pad, pad)
        }

        fun field(title: String, value: String, secret: Boolean): EditText {
            box.addView(label(title, 13f, textMain, true), matchWrap(10))
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

        box.addView(label("IA Big Data n°1 · Gemini (saison en cours)", 14f, yellow, true), matchWrap(20))
        val geminiKey = field("Clé API Gemini", prefs.geminiKey, true)
        val geminiModel = field("Modèle Gemini", prefs.geminiModel, false)

        box.addView(label("IA Big Data n°2 · OpenAI (saison passée, joueurs)", 14f, yellow, true), matchWrap(20))
        val openaiKey = field("Clé API OpenAI", prefs.openaiKey, true)
        val openaiModel = field("Modèle OpenAI", prefs.openaiModel, false)

        // Test des connexions (avec les valeurs saisies, avant même d'enregistrer)
        val testBtn = button("Tester les connexions", chip)
        val testOut = label("", 12f, textMain)
        testBtn.setOnClickListener {
            val ck = claudeKey.text.toString().trim()
            val cm = claudeModel.text.toString().trim().ifBlank { Prefs.DEFAULT_CLAUDE }
            val gk = geminiKey.text.toString().trim()
            val gm = geminiModel.text.toString().trim().ifBlank { Prefs.DEFAULT_GEMINI }
            val ok = openaiKey.text.toString().trim()
            val om = openaiModel.text.toString().trim().ifBlank { Prefs.DEFAULT_OPENAI }
            testOut.text = "Test en cours…"
            testBtn.isEnabled = false
            Thread {
                val l1 = "Claude : " + testOne(ck) {
                    ClaudeClient.call(ck, cm, "Réponds uniquement OK.", "Réponds OK", emptyList(), 16)
                }
                val l2 = "Big Data n°1 (Gemini) : " + testOne(gk) {
                    GeminiClient.call(gk, gm, "Réponds uniquement OK.", false)
                }
                val l3 = "Big Data n°2 (OpenAI) : " + testOne(ok) {
                    OpenAiClient.call(ok, om, "Réponds uniquement OK.", false)
                }
                runOnUiThread {
                    testOut.text = listOf(l1, l2, l3).joinToString("\n")
                    testBtn.isEnabled = true
                }
            }.start()
        }
        box.addView(testBtn, matchWrap(20))
        box.addView(testOut, matchWrap(8))

        box.addView(
            label(
                "Les clés sont chiffrées sur ce téléphone (Android Keystore) et envoyées seulement au service concerné. Si un nom de modèle est refusé, remplacez-le par un modèle disponible sur votre compte.",
                12f, textMuted
            ), matchWrap(16)
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

    // --------------------------------------------------------- Historique

    private fun showHistory() {
        val entries = History.load(this)
        val st = History.stats(entries)
        val fmt = SimpleDateFormat("dd/MM HH:mm", Locale.FRANCE)

        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(12), dp(16), dp(12))
        }

        box.addView(label("Bilan de vos pronostics notés", 14f, yellow, true))
        if (st.rated == 0) {
            box.addView(
                label(
                    "Aucun résultat saisi pour l'instant. Ouvrez une analyse et marquez chaque pronostic « Réussi » ou « Raté » après le match : l'application mesure ainsi sa vraie fiabilité.",
                    12f, textMuted
                ), matchWrap(4)
            )
        } else {
            val rate = 100.0 * st.won / st.rated
            box.addView(label("Global : ${st.won}/${st.rated} réussis (${rate.roundToInt()} %)", 13f, textMain), matchWrap(4))
            box.addView(label("Probabilité moyenne annoncée : ${st.avgPredicted.roundToInt()} %", 13f, textMuted))
            if (st.sureRated > 0) {
                val r90 = 100.0 * st.sureWon / st.sureRated
                box.addView(label("Pronostics ≥ 90 % : ${st.sureWon}/${st.sureRated} réussis (${r90.roundToInt()} %)", 13f, textMain))
            } else {
                box.addView(label("Pronostics ≥ 90 % : aucun noté", 13f, textMuted))
            }
            val verdict: String
            val verdictColor: Int
            if (st.rated < 10) {
                verdict = "Échantillon encore petit (moins de 10 pronostics notés) : bilan peu significatif."
                verdictColor = textMuted
            } else if (st.avgPredicted - rate > 8.0) {
                verdict = "⚠ Les probabilités annoncées sont plus hautes que la réussite réelle : ne vous fiez pas aveuglément aux pourcentages."
                verdictColor = amber
            } else {
                verdict = "Les probabilités annoncées restent cohérentes avec la réussite réelle."
                verdictColor = green
            }
            box.addView(label(verdict, 12f, verdictColor), matchWrap(4))
        }

        box.addView(label("Analyses enregistrées", 14f, yellow, true), matchWrap(16))

        var dialog: AlertDialog? = null
        if (entries.isEmpty()) {
            box.addView(label("Aucune analyse enregistrée.", 12f, textMuted), matchWrap(4))
        }
        for (e in entries) {
            val parsed = ResultParser.parse(e.finalText)
            val total = parsed?.picks?.size ?: 0
            val noted = e.outcomes.count { it.value != 0 }
            val row = label("${fmt.format(Date(e.ts))} · ${e.title}\n$noted/$total pronostic(s) noté(s)", 13f, textMain)
            row.background = roundBg(chip, 10)
            row.setPadding(dp(12), dp(10), dp(12), dp(10))
            row.setOnClickListener {
                dialog?.dismiss()
                renderEntry(e)
            }
            box.addView(row, matchWrap(8))
        }

        val sv = ScrollView(this).apply {
            setBackgroundColor(card)
            addView(box)
        }

        val dlg = AlertDialog.Builder(this)
            .setTitle("Historique")
            .setView(sv)
            .setNegativeButton("Fermer", null)
            .setNeutralButton("Tout effacer") { _, _ -> confirmClearHistory() }
            .create()
        dialog = dlg
        dlg.show()
    }

    private fun confirmClearHistory() {
        AlertDialog.Builder(this)
            .setTitle("Effacer l'historique ?")
            .setMessage("Toutes les analyses enregistrées et vos résultats notés seront supprimés.")
            .setPositiveButton("Effacer") { _, _ ->
                History.clear(this)
                Toast.makeText(this, "Historique effacé.", Toast.LENGTH_SHORT).show()
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
            Toast.makeText(this, "⚡ Mode Autonome actif : analyse Big Data sans clé...", Toast.LENGTH_SHORT).show()
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

                val parsed = ResultParser.parse(result.finalText)
                val now = System.currentTimeMillis()
                val entry = Entry(
                    id = now,
                    ts = now,
                    title = if (parsed != null) ResultParser.title(parsed) else "Analyse",
                    finalText = result.finalText,
                    extraction = result.extraction,
                    bigData1 = result.bigData1,
                    bigData2 = result.bigData2,
                    notes = result.notes,
                    outcomes = mutableMapOf()
                )
                try {
                    History.add(this, entry)
                } catch (e: Exception) {
                    // l'historique est un bonus : on n'interrompt pas l'affichage
                }
                runOnUiThread {
                    statusText.text = ""
                    renderEntry(entry)
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

    private fun persistOutcomes(entry: Entry) {
        val copy = HashMap(entry.outcomes)
        Thread {
            try {
                History.updateOutcomes(this, entry.id, copy)
            } catch (e: Exception) {
                // ignoré : la note reste visible à l'écran
            }
        }.start()
    }

    /** Boutons « Réussi / Raté » : permettent de mesurer la vraie fiabilité de l'application. */
    private fun outcomeRow(entry: Entry, idx: Int): LinearLayout {
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val won = button("✅ Réussi", chip, textMain)
        val lost = button("❌ Raté", chip, textMain)
        won.textSize = 13f
        lost.textSize = 13f

        fun refresh() {
            val o = entry.outcomes[idx] ?: 0
            won.background = roundBg(if (o == 1) Color.parseColor("#15803D") else chip, 10)
            lost.background = roundBg(if (o == -1) Color.parseColor("#B91C1C") else chip, 10)
        }

        fun mark(v: Int) {
            val cur = entry.outcomes[idx] ?: 0
            entry.outcomes[idx] = if (cur == v) 0 else v
            refresh()
            persistOutcomes(entry)
        }

        won.setOnClickListener { mark(1) }
        lost.setOnClickListener { mark(-1) }
        refresh()

        row.addView(won, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply { rightMargin = dp(6) })
        row.addView(lost, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        return row
    }

    private fun renderEntry(entry: Entry) {
        resultBox.removeAllViews()

        val parsed = ResultParser.parse(entry.finalText)
        if (parsed == null) {
            val c = cardBox()
            c.addView(label("Réponse de Claude (format inattendu)", 16f, amber, true))
            c.addView(label(entry.finalText, 13f, textMain))
            resultBox.addView(c)
            addDetails(entry)
            scrollToResults()
            return
        }

        // Carte match
        val head = cardBox()
        head.addView(label(ResultParser.title(parsed), 18f, textMain, true))
        val sub = listOf(parsed.comp, parsed.date).filter { it.isNotBlank() }.joinToString(" · ")
        if (sub.isNotBlank()) head.addView(label(sub, 13f, textMuted))
        val qColor = when (parsed.quality) {
            "bonne" -> green
            "faible" -> red
            else -> amber
        }
        head.addView(label("Qualité des données : ${parsed.quality}", 13f, qColor, true))
        resultBox.addView(head)

        // Alertes sur les sources
        if (entry.notes.isNotEmpty()) {
            val c = cardBox()
            c.addView(label("⚠ Sources indisponibles", 14f, amber, true))
            for (n in entry.notes) c.addView(label("• $n", 12f, textMain))
            c.addView(label("Sans les deux IA Big Data, la fiabilité des pronostics est réduite.", 12f, textMuted))
            resultBox.addView(c)
        }

        // Bandeau 90 %
        val reliable = parsed.picks.filter { ResultParser.isSure(it, parsed.quality) }
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
        for ((idx, p) in parsed.picks.withIndex()) {
            val sure = ResultParser.isSure(p, parsed.quality)
            val c = cardBox()
            c.addView(label("${ResultParser.marketLabel(p)} · ${ResultParser.targetLabel(p)}", 13f, textMuted))
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
            c.addView(label("Résultat réel après le match (pour le suivi) :", 12f, textMuted), matchWrap(10))
            c.addView(outcomeRow(entry, idx), matchWrap(4))
            resultBox.addView(c)
        }

        // Synthèse
        if (parsed.synthese.isNotBlank()) {
            val c = cardBox()
            c.addView(label("🔎 Synthèse", 15f, textMain, true))
            c.addView(label(parsed.synthese, 13f, textMain))
            resultBox.addView(c)
        }

        // Données manquantes
        if (parsed.missing.isNotEmpty()) {
            val c = cardBox()
            c.addView(label("Données manquantes", 15f, amber, true))
            for (m in parsed.missing) c.addView(label("• $m", 12f, textMain))
            resultBox.addView(c)
        }

        // Partage
        val shareText = ResultParser.shareText(parsed)
        val shareCard = cardBox()
        shareCard.addView(label("Partager ce pronostic", 15f, textMain, true))
        val shareRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val shareBtn = button("Partager", Color.parseColor("#2563EB"))
        val copyBtn = button("Copier", chip, textMain)
        shareBtn.setOnClickListener {
            val send = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, shareText)
            }
            startActivity(Intent.createChooser(send, "Partager l'analyse"))
        }
        copyBtn.setOnClickListener {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(ClipData.newPlainText("Analys C&J Performances", shareText))
            Toast.makeText(this, "Analyse copiée.", Toast.LENGTH_SHORT).show()
        }
        shareRow.addView(shareBtn, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply { rightMargin = dp(6) })
        shareRow.addView(copyBtn, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        shareCard.addView(shareRow, matchWrap(8))
        resultBox.addView(shareCard)

        addDetails(entry)

        val warn = cardBox()
        warn.addView(
            label(
                "Ces résultats sont des estimations statistiques produites par des IA : aucune garantie de résultat. Les paris comportent un risque de perte, réservés aux personnes majeures. Ne misez jamais plus que ce que vous pouvez perdre.",
                12f, textMuted
            )
        )
        resultBox.addView(warn)

        scrollToResults()
    }

    private fun scrollToResults() {
        scrollView.post { scrollView.smoothScrollTo(0, resultBox.top) }
    }

    private fun addDetails(entry: Entry) {
        addCollapsible("Détail · Lecture des captures (Claude)", entry.extraction)
        addCollapsible("Détail · Big Data n°1 (Gemini)", entry.bigData1)
        addCollapsible("Détail · Big Data n°2 (OpenAI)", entry.bigData2)
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

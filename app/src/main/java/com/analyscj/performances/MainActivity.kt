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
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.HorizontalScrollView
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

    private lateinit var scrollView: ScrollView
    private lateinit var leaguesRow: LinearLayout
    private lateinit var matchesContainer: LinearLayout
    private lateinit var contextInput: EditText
    private lateinit var analyzeBtn: Button
    private lateinit var statusText: TextView
    private lateinit var resultBox: LinearLayout

    private var selectedLeagueIndex = 0
    private var selectedMatchName = "Paris Saint-Germain vs Olympique de Marseille"

    data class AndroidLeague(
        val name: String,
        val flag: String,
        val shortName: String,
        val defaultMatches: List<String>
    )

    private val leaguesList = listOf(
        AndroidLeague("Ligue 1", "🇫🇷", "L1", listOf(
            "Paris Saint-Germain vs Olympique de Marseille",
            "AS Monaco vs Olympique Lyonnais",
            "LOSC Lille vs RC Lens"
        )),
        AndroidLeague("Premier League", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "EPL", listOf(
            "Arsenal FC vs Chelsea FC",
            "Liverpool FC vs Manchester City",
            "Manchester United vs Tottenham"
        )),
        AndroidLeague("Serie A", "🇮🇹", "Serie A", listOf(
            "Inter Milan vs Juventus Turin",
            "AC Milan vs AS Roma",
            "Napoli vs Lazio Rome"
        )),
        AndroidLeague("Bundesliga", "🇩🇪", "BUN", listOf(
            "Bayern Munich vs Borussia Dortmund",
            "Bayer Leverkusen vs RB Leipzig",
            "Eintracht Francfort vs VfB Stuttgart"
        )),
        AndroidLeague("La Liga", "🇪🇸", "LaLiga", listOf(
            "Real Madrid vs FC Barcelone",
            "Atlético de Madrid vs Séville FC",
            "Athletic Bilbao vs Real Sociedad"
        )),
        AndroidLeague("Premier League Portugal", "🇵🇹", "Portugal", listOf(
            "SL Benfica vs FC Porto",
            "Sporting CP vs SC Braga",
            "Vitória Guimarães vs Boavista"
        ))
    )

    @Volatile
    private var running = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = Prefs(this)
        window.statusBarColor = bg
        window.navigationBarColor = bg
        buildUi()
        selectLeague(0)
    }

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
        titles.addView(label("Analys C&J Performances", 20f, yellow, true))
        titles.addView(label("Cartons Jaunes & Corners · ≥ 80% Probabilité", 12f, green, true))
        titles.addView(label("Conforme conditions ngengesport.cd (Congo RDC)", 11f, textMuted))

        val historyBtn = button("📚", card, textMain)
        historyBtn.setOnClickListener { showHistory() }
        val settingsBtn = button("⚙", card, textMain)
        settingsBtn.setOnClickListener { showSettings() }
        header.addView(titles)
        header.addView(historyBtn)
        header.addView(settingsBtn)
        root.addView(header)

        // Bandeau NgengeSport
        val banner = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = roundBg(Color.parseColor("#1C1917"), 10)
            setPadding(dp(12), dp(8), dp(12), dp(8))
        }
        banner.addView(label("⚖️ RÈGLES NGENGESPORT.CD APPLIQUÉES :", 11f, yellow, true))
        banner.addView(label("• Cartons : Seuls les cartons jaunes donnés aux joueurs sur le terrain pendant 90 min comptent.\n• Corners : Seuls les corners effectivement tirés comptent.\n• Filtrage rigoureux : Sélections avec probabilité calculée ≥ 80%.", 11f, textMuted))
        root.addView(banner, matchWrap(12))

        // Étape 1 : Les 6 Championnats
        val leagueCard = cardBox()
        leagueCard.addView(label("1. Choisir le Championnat", 15f, textMain, true))
        val hScroll = HorizontalScrollView(this)
        leaguesRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        hScroll.addView(leaguesRow)
        leagueCard.addView(hScroll, matchWrap(8))
        root.addView(leagueCard)

        // Étape 2 : Affiches du championnat
        val matchCard = cardBox()
        matchCard.addView(label("2. Match du Championnat", 15f, textMain, true))
        matchesContainer = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        matchCard.addView(matchesContainer, matchWrap(6))

        // Ou saisie manuelle personnalisée
        matchCard.addView(label("Ou personnaliser le match :", 12f, textMuted), matchWrap(10))
        contextInput = EditText(this).apply {
            hint = "Ex. : PSG vs Marseille, Arbitre Bastien..."
            setHintTextColor(textMuted)
            setTextColor(textMain)
            textSize = 13f
            minLines = 1
            background = roundBg(Color.parseColor("#090D16"), 8)
            setPadding(dp(10), dp(8), dp(10), dp(8))
        }
        matchCard.addView(contextInput, matchWrap(4))
        root.addView(matchCard)

        // Étape 3 : LE BOUTON DEMANDÉ PAR L'UTILISATEUR "DONNE LES STATS"
        analyzeBtn = button("📊 DONNE LES STATS (≥ 80% PROBA)", Color.parseColor("#EAB308"), Color.parseColor("#020617")).apply {
            textSize = 15f
            typeface = Typeface.DEFAULT_BOLD
            setOnClickListener { startAnalysis() }
        }
        root.addView(analyzeBtn, matchWrap(14))

        statusText = label("", 12f, amber)
        statusText.gravity = Gravity.CENTER
        root.addView(statusText, matchWrap(6))

        resultBox = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        root.addView(resultBox)

        setContentView(scrollView)
    }

    private fun selectLeague(index: Int) {
        selectedLeagueIndex = index
        leaguesRow.removeAllViews()
        for ((idx, lg) in leaguesList.withIndex()) {
            val isSel = idx == index
            val btn = TextView(this).apply {
                text = "${lg.flag} ${lg.name}"
                textSize = 12f
                setTextColor(if (isSel) Color.parseColor("#020617") else textMain)
                background = roundBg(if (isSel) yellow else chip, 8)
                setPadding(dp(12), dp(8), dp(12), dp(8))
                setTypeface(typeface, if (isSel) Typeface.BOLD else Typeface.NORMAL)
                setOnClickListener { selectLeague(idx) }
            }
            val lp = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                rightMargin = dp(6)
            }
            leaguesRow.addView(btn, lp)
        }

        // Mettre à jour les matchs de la ligue
        matchesContainer.removeAllViews()
        val curLeague = leaguesList[index]
        for (m in curLeague.defaultMatches) {
            val isSel = m == selectedMatchName
            val mBtn = TextView(this).apply {
                text = m
                textSize = 13f
                setTextColor(if (isSel) yellow else textMain)
                background = roundBg(if (isSel) Color.parseColor("#0F172A") else Color.parseColor("#182234"), 8)
                setPadding(dp(12), dp(10), dp(12), dp(10))
                setTypeface(typeface, if (isSel) Typeface.BOLD else Typeface.NORMAL)
                setOnClickListener {
                    selectedMatchName = m
                    contextInput.setText(m)
                    selectLeague(selectedLeagueIndex)
                }
            }
            matchesContainer.addView(mBtn, matchWrap(4))
        }

        if (contextInput.text.isNullOrBlank()) {
            selectedMatchName = curLeague.defaultMatches.firstOrNull() ?: ""
            contextInput.setText(selectedMatchName)
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

        box.addView(label("Mode Autonome Déterministe 2026", 14f, green, true))
        box.addView(label("L'application fonctionne à 100% sans clé API externe en croisant la loi de Poisson et les conditions de ngengesport.cd.", 12f, textMuted))

        box.addView(label("Clés API optionnelles", 14f, yellow, true), matchWrap(16))
        val claudeKey = field("Clé Claude (optionnelle)", prefs.claudeKey, true)
        val geminiKey = field("Clé Gemini (optionnelle)", prefs.geminiKey, true)
        val openaiKey = field("Clé OpenAI (optionnelle)", prefs.openaiKey, true)

        val sv = ScrollView(this).apply {
            setBackgroundColor(card)
            addView(box)
        }

        AlertDialog.Builder(this)
            .setTitle("Réglages")
            .setView(sv)
            .setPositiveButton("Enregistrer") { _, _ ->
                prefs.claudeKey = claudeKey.text.toString()
                prefs.geminiKey = geminiKey.text.toString()
                prefs.openaiKey = openaiKey.text.toString()
                Toast.makeText(this, "Réglages enregistrés.", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Fermer", null)
            .show()
    }

    private fun showHistory() {
        val entries = History.load(this)
        val fmt = SimpleDateFormat("dd/MM HH:mm", Locale.FRANCE)

        val box = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(12), dp(16), dp(12))
        }

        box.addView(label("Historique des Rapprochements", 15f, yellow, true))
        if (entries.isEmpty()) {
            box.addView(label("Aucune analyse enregistrée. Appuyez sur « Donne les stats ».", 12f, textMuted), matchWrap(8))
        }

        var dialog: AlertDialog? = null
        for (e in entries) {
            val parsed = ResultParser.parse(e.finalText)
            val total = parsed?.picks?.size ?: 0
            val row = label("${fmt.format(Date(e.ts))} · ${e.title}\n$total pronostics certifiés ≥ 80%", 13f, textMain)
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
            .setNeutralButton("Tout effacer") { _, _ ->
                History.clear(this)
                Toast.makeText(this, "Historique effacé.", Toast.LENGTH_SHORT).show()
            }
            .create()
        dialog = dlg
        dlg.show()
    }

    private fun startAnalysis() {
        if (running) return

        val ctx = contextInput.text.toString().trim().ifBlank {
            selectedMatchName
        }

        running = true
        analyzeBtn.isEnabled = false
        analyzeBtn.alpha = 0.6f
        resultBox.removeAllViews()

        Thread {
            try {
                val result = Analyzer(prefs) { msg -> runOnUiThread { statusText.text = msg } }
                    .run(emptyList(), ctx)

                val parsed = ResultParser.parse(result.finalText)
                val now = System.currentTimeMillis()
                val entry = Entry(
                    id = now,
                    ts = now,
                    title = if (parsed != null) ResultParser.title(parsed) else ctx,
                    finalText = result.finalText,
                    extraction = result.extraction,
                    bigData1 = result.bigData1,
                    bigData2 = result.bigData2,
                    notes = result.notes,
                    outcomes = mutableMapOf()
                )

                try {
                    History.add(this, entry)
                } catch (e: Exception) {}

                runOnUiThread {
                    statusText.text = ""
                    renderEntry(entry)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    statusText.text = ""
                    val c = cardBox()
                    c.addView(label("Erreur de rapprochement", 15f, red, true))
                    c.addView(label(e.message ?: e.toString(), 12f, textMain))
                    resultBox.addView(c)
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

    private fun renderEntry(entry: Entry) {
        resultBox.removeAllViews()
        val parsed = ResultParser.parse(entry.finalText)

        val headerCard = cardBox()
        headerCard.addView(label("🎯 Rapprochement Validé (≥ 80% Probabilité)", 15f, green, true))
        headerCard.addView(label("Match : ${entry.title}", 14f, yellow, true))
        headerCard.addView(label("Conditions ngengesport.cd appliquées · Cartons 90 min & Corners tirés", 11f, textMuted))

        val copyBtn = button("📋 Copier le Coupon NgengeSport", Color.parseColor("#EAB308"), Color.parseColor("#020617"))
        copyBtn.setOnClickListener {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val text = "🎟️ COUPON NGENGESPORT.CD · ANALYS C&J (≥ 80% PROBA)\nMatch : ${entry.title}\n${entry.finalText}"
            cm.setPrimaryClip(ClipData.newPlainText("Coupon NgengeSport", text))
            Toast.makeText(this, "Coupon NgengeSport copié dans le presse-papier !", Toast.LENGTH_SHORT).show()
        }
        headerCard.addView(copyBtn, matchWrap(10))
        resultBox.addView(headerCard)

        if (parsed != null) {
            for (pick in parsed.picks) {
                val pCard = cardBox()
                val isYellow = pick.market.contains("carton", ignoreCase = true)
                val badgeColor = if (isYellow) yellow else green
                val badgeTitle = if (isYellow) "🟨 CARTONS JAUNES" else "🚩 CORNERS"

                val topRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
                val titleView = label(badgeTitle, 11f, badgeColor, true).apply {
                    layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
                }
                val probaView = label("${pick.probability}%", 14f, green, true)
                topRow.addView(titleView)
                topRow.addView(probaView)
                pCard.addView(topRow)

                pCard.addView(label(pick.selection, 15f, Color.WHITE, true), matchWrap(4))
                pCard.addView(label(pick.justification, 12f, textMain), matchWrap(6))

                for (factor in pick.factors) {
                    pCard.addView(label("• $factor", 11f, textMuted), matchWrap(2))
                }
                resultBox.addView(pCard)
            }

            if (parsed.synthesis.isNotBlank()) {
                val synthCard = cardBox()
                synthCard.addView(label("Synthèse du Rapprochement", 13f, yellow, true))
                synthCard.addView(label(parsed.synthesis, 12f, textMain), matchWrap(4))
                resultBox.addView(synthCard)
            }
        } else {
            val rawCard = cardBox()
            rawCard.addView(label(entry.finalText, 12f, textMain))
            resultBox.addView(rawCard)
        }
    }
}

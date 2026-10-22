package com.analyscj.performances

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Consignes données aux trois IA. Tout est centré sur les cartons jaunes et les corners. */
object Prompts {

    private fun today(): String =
        SimpleDateFormat("dd/MM/yyyy", Locale.FRANCE).format(Date())

    const val SYSTEM_ANALYSTE = """Tu es l'IA d'analyse de l'application « Analys C&J Performances ».
Tu travailles UNIQUEMENT sur deux marchés : les CARTONS JAUNES et les CORNERS.
Tu ignores tout le reste (buts, vainqueur, cotes, buteurs...). Tu réponds toujours en français.
Règles absolues :
- Tu n'inventes jamais une donnée. Si une information n'est pas lisible ou pas fournie, tu l'écris dans les données manquantes.
- Tu n'augmentes JAMAIS une probabilité pour atteindre 90 %. Les cartons et les corners sont des événements très variables : si aucune sélection n'atteint honnêtement 90 %, tu le dis clairement.
- Tu distingues la saison en cours et la saison passée, et tu donnes plus de poids à la saison en cours."""

    fun extraction(userContext: String): String = """Date du jour : ${today()}.
Tu reçois des captures d'écran d'informations sur un match de football (statistiques, classement, forme, compositions, blessés, suspendus, arbitre, historique...).
Lis TOUTES les captures avec attention et extrais les informations utiles pour prédire les CARTONS JAUNES et les CORNERS.

Contexte donné par l'utilisateur (peut être vide) : ${userContext.ifBlank { "aucun" }}

Réponds UNIQUEMENT avec un objet JSON valide (sans texte autour) de cette forme :
{
  "match": {"domicile": "", "exterieur": "", "competition": "", "date": "", "arbitre": ""},
  "stats_saison_en_cours": {"domicile": {...}, "exterieur": {...}},
  "stats_saison_passee": {"domicile": {...}, "exterieur": {...}},
  "forme_recente": {"domicile": "", "exterieur": ""},
  "joueurs": [{"nom": "", "equipe": "", "etat": "blessé|suspendu|menacé de suspension|incertain|apte|inconnu", "cartons_jaunes": null, "remarque": ""}],
  "face_a_face": "",
  "autres_infos_utiles": [""],
  "illisible_ou_absent": [""]
}
Dans les objets de stats, utilise les noms exacts lus sur les captures (ex. cartons_jaunes_par_match, corners_par_match, fautes_par_match, matchs_joues...) avec leurs valeurs, et indique si la valeur concerne le domicile, l'extérieur ou le total.
Mets null ou omets ce qui n'est pas visible. Ne devine rien."""

    fun bigData1(extractionJson: String): String = """Tu es l'IA Big Data n°1 de l'application « Analys C&J Performances ». Date du jour : ${today()}.
Ta mission : fournir des DONNÉES CHIFFRÉES sur la SAISON EN COURS pour ce match, uniquement sur les CARTONS JAUNES et les CORNERS.

Informations lues sur les captures :
$extractionJson

Recherche et fournis, pour chaque équipe (en séparant domicile / extérieur quand c'est possible) :
1. Moyenne de cartons jaunes par match et de corners par match (obtenus ET concédés) sur la saison en cours.
2. Tendance sur les 5 à 10 derniers matchs (cartons jaunes, corners).
3. Arbitre désigné (si connu) : moyenne de cartons jaunes par match cette saison.
4. Enjeu et contexte du match (derby, lutte pour le titre ou le maintien, intensité attendue) et style de jeu (pressing, jeu long, possession, centres).
5. Nombre de matchs sur lesquels reposent tes chiffres.

Règles : indique la source et la date de chaque donnée quand tu en as une. Écris « donnée introuvable » plutôt que d'inventer. Réponds de façon structurée et concise, sans conclusion de pari."""

    fun bigData2(extractionJson: String): String = """Tu es l'IA Big Data n°2 de l'application « Analys C&J Performances ». Date du jour : ${today()}.
Ta mission : fournir des DONNÉES CHIFFRÉES sur la SAISON PASSÉE comparée à la saison en cours, ainsi que sur l'ÉTAT DES JOUEURS, uniquement pour les CARTONS JAUNES et les CORNERS.

Informations lues sur les captures :
$extractionJson

Recherche et fournis :
1. Saison passée vs saison en cours pour chaque équipe : moyennes de cartons jaunes et de corners par match, et évolution (hausse, baisse, stable).
2. Joueurs clés des deux équipes : cartons jaunes cette saison et la saison passée, fautes par match, profil disciplinaire (les plus avertis).
3. État des joueurs : blessés, suspendus, menacés de suspension, retours de blessure, changements d'effectif importants entre la saison passée et la saison en cours (qui influencent le style et la discipline).
4. Confrontations directes récentes (jusqu'à 5) : cartons jaunes et corners dans chacune.
5. Nombre de matchs sur lesquels reposent tes chiffres.

Règles : indique la source et la date de chaque donnée quand tu en as une. Écris « donnée introuvable » plutôt que d'inventer. Réponds de façon structurée et concise, sans conclusion de pari."""

    fun finale(
        extractionJson: String,
        bigData1: String,
        bigData2: String,
        userContext: String
    ): String = """Date du jour : ${today()}.
Tu es l'analyste final. Voici les trois sources dont tu disposes.

[A] LECTURE DES CAPTURES (par toi) :
$extractionJson

[B] BIG DATA n°1 — saison en cours :
${bigData1.ifBlank { "NON DISPONIBLE (IA non configurée ou en erreur)" }}

[C] BIG DATA n°2 — saison passée, joueurs, face-à-face :
${bigData2.ifBlank { "NON DISPONIBLE (IA non configurée ou en erreur)" }}

Contexte de l'utilisateur : ${userContext.ifBlank { "aucun" }}

Travail à faire :
- Croise les trois sources (performances de l'équipe sur la saison en cours, performances équipes et joueurs saison passée et en cours, état des joueurs). Signale toute contradiction entre sources.
- Propose des pronostics UNIQUEMENT sur : cartons jaunes (total du match, et par équipe si les données le permettent) et corners (total du match, et par équipe si les données le permettent), sous forme de « Plus de X,5 » ou « Moins de X,5 ».
- Pour chaque pronostic, donne une probabilité honnête (0 à 100) fondée sur les données. Une sélection n'est « fiable à 90 % » que si les données la soutiennent réellement (échantillon suffisant, sources concordantes). Si les données sont insuffisantes, baisse la probabilité et dis-le.
- Choisis de préférence des lignes prudentes (marge confortable) plutôt que des lignes serrées.
- 6 pronostics maximum, triés du plus probable au moins probable.

Réponds UNIQUEMENT avec un objet JSON valide (sans texte autour) de cette forme :
{
  "match": {"domicile": "", "exterieur": "", "competition": "", "date": ""},
  "qualite_donnees": "bonne|partielle|faible",
  "pronostics": [
    {"marche": "cartons_jaunes|corners", "cible": "match|domicile|exterieur", "selection": "Plus de 4,5", "probabilite": 0, "justification": "", "facteurs": [""]}
  ],
  "synthese": "",
  "donnees_manquantes": [""]
}"""
}

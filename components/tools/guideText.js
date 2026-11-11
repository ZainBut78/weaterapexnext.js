// ─────────────────────────────────────────────────────────────
//  Trip Planner / Events ke neeche wala content (Nov 2026), 6 zabanein.
//  Har baat code se mili hui hai (backend: trip_planner/scoring.py, trip_planner/views.py,
//  events/scoring.py, events/views.py). Formula badle to yeh text bhi.
//  FAQ ke jawab plain text: wahi string page par aur FAQPage JSON-LD mein (hoobahoo).
//  Misaal ke numbers: data/toolGuides.json (python manage.py tool_examples).
// ─────────────────────────────────────────────────────────────

const en = {
  trip: {
    scoreTitle: 'How the Trip Planner score works',
    score: [
      'Enter a city or a whole country and your travel dates, up to 20 days. If your trip ends within the next 15 days, the planner uses the live hourly forecast. If it is further away, it uses 20 years of climate data for those dates instead and labels the result as an estimate, not a forecast.',
      'Every day gets a score from 1 to 10. It starts at 10 and loses points for weather that spoils a day out. A chance of rain above 20% costs up to 5 points, each rainy daytime hour costs 0.4, each millimetre of rain 0.15 (at most 3 points for the rain amount), and a thunderstorm costs 2. Wind above 20 km/h costs up to 2 points. Heat above 32 °C or cold below 5 °C costs 1 point; above 38 °C or below 0 °C it costs 2. A day whose icon shows rain never scores above 8.4.',
      'Excellent is 8.5–10, good 7–8.4, fair 5–6.9 and poor below 5. A good day scores 7 or more: little rain, light wind and comfortable temperatures. For each day you also see the morning, afternoon and evening, the activity that suits the weather best and a short packing list.',
    ],
    exampleTitle: (city) => `Example: ${city} through the year`,
    exampleIntro: (city, from, to) => `What would a typical day in ${city} score in each month? This is the same calculation the planner makes for trips more than 15 days away: the ${from}–${to} averages, with the chance of rain taken as the average number of rainy days divided by 30.`,
    exampleOutro: ({ best, bestScore, worst, worstScore, rainOnly }) => `${best} scores best (${bestScore}) and ${worst} lowest (${worstScore}).${rainOnly ? ' The difference comes from rain alone: the temperatures never reach a level that costs points.' : ''}`,
    cols: { month: 'Month', high: 'Average high', rain: 'Chance of rain', score: 'Day score' },
    useTitle: 'What people use it for',
    uses: [
      ['City breaks', 'Put walking tours and markets on the driest days and keep museums for the wet ones.'],
      ['Beach trips', 'The planner only suggests the beach on warm, dry days in coastal cities.'],
      ['Hiking', 'Thunder and strong wind pull the score down quickly, so long trails go on the calm days.'],
    ],
    faq: [
      ['How far ahead can I plan a trip?', 'You can pick any dates. Up to 15 days ahead you get the live forecast; for later trips the planner shows an estimate from 20 years of climate data for the same dates.'],
      ['What does the day score mean?', 'It rates from 1 to 10 how good the weather is for being outside: 8.5–10 is excellent, 7–8.4 good, 5–6.9 fair and below 5 poor.'],
      ['Is a 40% chance of rain a bad day?', 'Not on its own. It costs about 1.6 points, so the day can still be good. If the forecast also shows several rainy hours or heavy rain, the score falls further.'],
      ['Can I plan a trip to a whole country?', 'Yes. Switch to the country mode to compare its cities for your dates, then open one city for the day-by-day plan.'],
      ['How many days can one trip have?', 'Up to 20 days in one plan.'],
    ],
  },
  events: {
    scoreTitle: 'How the event risk score works',
    score: [
      'Choose the type of event, the place and the date, up to 10 days ahead, and if you like a start time. The checker reads the hourly forecast and scores a 3-hour window from 0 to 10. The higher the number, the more the weather could disrupt your event.',
      'Four things add to the risk. Every 10% chance of rain adds 1 point. Wind adds 1 point above 15 km/h, 2 above 25 km/h and 4 above 40 km/h. Temperature adds 1 point below 10 °C, 3 below 5 °C, 2 above 32 °C and 4 above 38 °C. Humidity adds 1 point above 60% and 2 above 80%.',
      'Each event type weighs these differently. For a wedding rain counts 1.5 times, for a marathon heat counts 1.6 times and humidity 1.4 times, and for a concert wind counts 1.5 times. Festivals count rain 1.3 times, and picnics and barbecues 1.4 times. Up to 3 is low risk, up to 6 moderate and above 6 high. The checker also shows the best time window that day and how the nearby days compare.',
    ],
    exampleTitle: (city) => `Example: a wedding in ${city}`,
    exampleIntro: (city, from, to) => `The checker needs a real forecast, so it only works up to 10 days ahead. To show how the score behaves, here is the wedding formula applied to an average day in ${city} in each month (${from}–${to} averages: chance of rain = rainy days divided by 30, the typical afternoon high and humidity, no wind).`,
    exampleOutro: ({ lowMonths, lowScore, high, highScore }) => `${lowMonths} come out as low risk (${lowScore}), while ${high} reaches ${highScore}. Because rain counts 1.5 times for a wedding, a wet month quickly becomes high risk. On the day itself, the hourly forecast for your chosen hours decides.`,
    cols: { month: 'Month', rain: 'Chance of rain', high: 'Average high', humidity: 'Humidity', risk: 'Wedding risk' },
    levels: { low: 'low', moderate: 'moderate', high: 'high' },
    useTitle: 'What people use it for',
    uses: [
      ['Weddings', 'Check the ceremony and photo hours, and book a tent when the risk is moderate.'],
      ['Concerts', 'Wind counts most for open-air stages and sound.'],
      ['Marathons', 'Heat and humidity count most for runners, so the start time matters.'],
      ['Festivals', 'Check each day of a multi-day festival on its own.'],
      ['BBQs and garden parties', 'Pick "Picnic/BBQ": rain counts 1.4 times and wind 1.2 times.'],
    ],
    faq: [
      ['How far ahead can I check the weather for my wedding date?', 'Up to 10 days ahead, because the score needs a real hourly forecast. For a date further away, the month page of your city shows how often it rains at that time of year.'],
      ['What is the chance of rain on my event day?', 'The checker shows the forecast chance of rain for each hour of your event window and adds 1 risk point for every 10%, weighted by the type of event.'],
      ['What do low, moderate and high risk mean?', 'Low (0–3): go ahead as planned. Moderate (up to 6): have a backup such as a tent or an indoor option. High (above 6): consider another time or day; the checker suggests better windows.'],
      ['Why is the risk different for a wedding and a marathon?', 'Each event weighs the weather differently. Rain matters most at a wedding, while heat and humidity matter most for runners.'],
      ['What is the best time of day for an outdoor event?', 'It depends on the forecast. The checker scores every 3-hour window from 6 am and shows the one with the lowest risk.'],
    ],
  },
  citiesTitle: 'Popular city pages',
  blogTitle: 'Related guides',
};

const de = {
  trip: {
    scoreTitle: 'So funktioniert der Score des Reiseplaners',
    score: [
      'Geben Sie eine Stadt oder ein ganzes Land und Ihre Reisedaten ein, bis zu 20 Tage. Endet die Reise innerhalb der nächsten 15 Tage, nutzt der Planer die aktuelle stündliche Vorhersage. Liegt sie weiter in der Zukunft, rechnet er mit 20 Jahren Klimadaten für dieselben Tage und kennzeichnet das Ergebnis als Schätzung, nicht als Vorhersage.',
      'Jeder Tag bekommt einen Wert von 1 bis 10. Er beginnt bei 10 und verliert Punkte für Wetter, das einen Tag draußen verdirbt. Eine Regenwahrscheinlichkeit über 20 % kostet bis zu 5 Punkte, jede Regenstunde am Tag kostet 0,4, jeder Millimeter Regen 0,15 (für die Regenmenge höchstens 3 Punkte), ein Gewitter kostet 2. Wind über 20 km/h kostet bis zu 2 Punkte. Hitze über 32 °C oder Kälte unter 5 °C kostet 1 Punkt, über 38 °C oder unter 0 °C 2 Punkte. Zeigt das Symbol eines Tages Regen, liegt der Wert nie über 8,4.',
      'Ausgezeichnet ist 8,5–10, gut 7–8,4, mittel 5–6,9 und schlecht unter 5. Ein guter Tag hat 7 oder mehr: wenig Regen, wenig Wind und angenehme Temperaturen. Für jeden Tag sehen Sie außerdem Vormittag, Nachmittag und Abend, die passende Aktivität und eine kurze Packliste.',
    ],
    exampleTitle: (city) => `Beispiel: ${city} im Jahresverlauf`,
    exampleIntro: (city, from, to) => `Welchen Wert hätte ein typischer Tag in ${city} in jedem Monat? Es ist dieselbe Rechnung, die der Planer für Reisen in mehr als 15 Tagen macht: die Durchschnitte ${from}–${to}, wobei die Regenwahrscheinlichkeit der mittleren Zahl der Regentage geteilt durch 30 entspricht.`,
    exampleOutro: ({ best, bestScore, worst, worstScore, rainOnly }) => `${best} schneidet am besten ab (${bestScore}), ${worst} am schwächsten (${worstScore}).${rainOnly ? ' Der Unterschied kommt allein vom Regen: Die Temperaturen erreichen nie einen Wert, der Punkte kostet.' : ''}`,
    cols: { month: 'Monat', high: 'Mittleres Maximum', rain: 'Regenwahrscheinlichkeit', score: 'Tageswert' },
    useTitle: 'Wofür man ihn nutzt',
    uses: [
      ['Städtereisen', 'Stadtführungen und Märkte auf die trockensten Tage legen, Museen auf die nassen.'],
      ['Strandurlaub', 'Den Strand schlägt der Planer nur an warmen, trockenen Tagen in Küstenstädten vor.'],
      ['Wandern', 'Gewitter und starker Wind senken den Wert schnell, also lange Touren an ruhigen Tagen.'],
    ],
    faq: [
      ['Wie weit im Voraus kann ich eine Reise planen?', 'Sie können beliebige Daten wählen. Bis 15 Tage im Voraus erhalten Sie die aktuelle Vorhersage, für spätere Reisen eine Schätzung aus 20 Jahren Klimadaten für dieselben Tage.'],
      ['Was bedeutet der Tageswert?', 'Er bewertet von 1 bis 10, wie gut das Wetter für draußen ist: 8,5–10 ist ausgezeichnet, 7–8,4 gut, 5–6,9 mittel und unter 5 schlecht.'],
      ['Ist eine Regenwahrscheinlichkeit von 40 % ein schlechter Tag?', 'Allein nicht. Sie kostet etwa 1,6 Punkte, der Tag kann also gut bleiben. Zeigt die Vorhersage zusätzlich mehrere Regenstunden oder starken Regen, sinkt der Wert weiter.'],
      ['Kann ich eine Reise in ein ganzes Land planen?', 'Ja. Im Ländermodus vergleichen Sie die Städte für Ihre Daten und öffnen dann eine Stadt für den Plan Tag für Tag.'],
      ['Wie viele Tage darf eine Reise haben?', 'Bis zu 20 Tage in einem Plan.'],
    ],
  },
  events: {
    scoreTitle: 'So funktioniert das Wetterrisiko für Events',
    score: [
      'Wählen Sie die Art des Events, den Ort und das Datum, bis zu 10 Tage im Voraus, und auf Wunsch eine Uhrzeit. Der Check liest die stündliche Vorhersage und bewertet ein 3-Stunden-Fenster von 0 bis 10. Je höher die Zahl, desto eher kann das Wetter Ihr Event stören.',
      'Vier Dinge erhöhen das Risiko. Je 10 % Regenwahrscheinlichkeit kommt 1 Punkt dazu. Wind bringt 1 Punkt über 15 km/h, 2 über 25 km/h und 4 über 40 km/h. Die Temperatur bringt 1 Punkt unter 10 °C, 3 unter 5 °C, 2 über 32 °C und 4 über 38 °C. Luftfeuchtigkeit bringt 1 Punkt über 60 % und 2 über 80 %.',
      'Jede Event-Art gewichtet das anders. Bei einer Hochzeit zählt Regen 1,5-fach, beim Marathon Hitze 1,6-fach und Feuchtigkeit 1,4-fach, beim Konzert Wind 1,5-fach. Bei Festivals zählt Regen 1,3-fach, bei Picknick und Grillen 1,4-fach. Bis 3 ist geringes Risiko, bis 6 mittleres und über 6 hohes. Der Check zeigt auch das beste Zeitfenster des Tages und wie die Nachbartage abschneiden.',
    ],
    exampleTitle: (city) => `Beispiel: eine Hochzeit in ${city}`,
    exampleIntro: (city, from, to) => `Der Check braucht eine echte Vorhersage und funktioniert daher nur bis 10 Tage im Voraus. Um das Verhalten des Werts zu zeigen, hier die Hochzeitsformel für einen durchschnittlichen Tag in ${city} in jedem Monat (Durchschnitte ${from}–${to}: Regenwahrscheinlichkeit = Regentage geteilt durch 30, übliches Tagesmaximum und Luftfeuchtigkeit, kein Wind).`,
    exampleOutro: ({ lowMonths, lowScore, high, highScore }) => `${lowMonths} ergeben ein geringes Risiko (${lowScore}), ${high} dagegen ${highScore}. Weil Regen bei einer Hochzeit 1,5-fach zählt, wird ein nasser Monat schnell zum hohen Risiko. Am Tag selbst entscheidet die stündliche Vorhersage für Ihre Uhrzeit.`,
    cols: { month: 'Monat', rain: 'Regenwahrscheinlichkeit', high: 'Mittleres Maximum', humidity: 'Luftfeuchtigkeit', risk: 'Hochzeitsrisiko' },
    levels: { low: 'gering', moderate: 'mittel', high: 'hoch' },
    useTitle: 'Wofür man ihn nutzt',
    uses: [
      ['Hochzeiten', 'Trauung und Fotozeit prüfen und bei mittlerem Risiko ein Zelt einplanen.'],
      ['Konzerte', 'Bei Open-Air-Bühnen und Ton zählt der Wind am meisten.'],
      ['Marathons', 'Für Läufer zählen Hitze und Feuchtigkeit am meisten, daher ist die Startzeit wichtig.'],
      ['Festivals', 'Bei mehrtägigen Festivals jeden Tag einzeln prüfen.'],
      ['Grillabende und Gartenpartys', '„Picknick/Grillen“ wählen: Regen zählt 1,4-fach, Wind 1,2-fach.'],
    ],
    faq: [
      ['Wie weit im Voraus kann ich das Wetter für meinen Hochzeitstermin prüfen?', 'Bis zu 10 Tage im Voraus, weil der Wert eine echte stündliche Vorhersage braucht. Für spätere Termine zeigt die Monatsseite Ihrer Stadt, wie oft es zu dieser Jahreszeit regnet.'],
      ['Wie hoch ist die Regenwahrscheinlichkeit an meinem Event-Tag?', 'Der Check zeigt die vorhergesagte Regenwahrscheinlichkeit für jede Stunde Ihres Zeitfensters und rechnet je 10 % einen Risikopunkt, gewichtet nach Event-Art.'],
      ['Was bedeuten geringes, mittleres und hohes Risiko?', 'Gering (0–3): wie geplant. Mittel (bis 6): einen Plan B wie ein Zelt oder einen Raum bereithalten. Hoch (über 6): eine andere Uhrzeit oder einen anderen Tag erwägen; der Check schlägt bessere Zeitfenster vor.'],
      ['Warum ist das Risiko bei Hochzeit und Marathon unterschiedlich?', 'Jede Event-Art gewichtet das Wetter anders. Bei einer Hochzeit zählt Regen am meisten, für Läufer Hitze und Feuchtigkeit.'],
      ['Welche Tageszeit ist am besten für ein Event im Freien?', 'Das hängt von der Vorhersage ab. Der Check bewertet jedes 3-Stunden-Fenster ab 6 Uhr und zeigt das mit dem geringsten Risiko.'],
    ],
  },
  citiesTitle: 'Beliebte Städte',
  blogTitle: 'Passende Ratgeber',
};

const fr = {
  trip: {
    scoreTitle: 'Comment fonctionne la note du planificateur',
    score: [
      'Indiquez une ville ou un pays entier et vos dates de voyage, jusqu’à 20 jours. Si le voyage se termine dans les 15 prochains jours, le planificateur utilise la prévision horaire en direct. S’il est plus lointain, il s’appuie sur 20 ans de données climatiques pour les mêmes dates et présente le résultat comme une estimation, pas comme une prévision.',
      'Chaque jour reçoit une note de 1 à 10. Elle part de 10 et perd des points pour la météo qui gâche une journée dehors. Un risque de pluie supérieur à 20 % coûte jusqu’à 5 points, chaque heure de pluie en journée coûte 0,4 point, chaque millimètre de pluie 0,15 (au plus 3 points pour la quantité de pluie), et un orage coûte 2 points. Un vent de plus de 20 km/h coûte jusqu’à 2 points. Une chaleur au-delà de 32 °C ou un froid sous 5 °C coûte 1 point ; au-delà de 38 °C ou sous 0 °C, 2 points. Un jour dont l’icône montre de la pluie ne dépasse jamais 8,4.',
      'Excellent correspond à 8,5–10, bon à 7–8,4, moyen à 5–6,9 et mauvais en dessous de 5. Une bonne journée obtient 7 ou plus : peu de pluie, peu de vent et des températures agréables. Pour chaque jour, vous voyez aussi le matin, l’après-midi et le soir, l’activité la plus adaptée et une courte liste de bagages.',
    ],
    exampleTitle: (city) => `Exemple : ${city} au fil de l’année`,
    exampleIntro: (city, from, to) => `Quelle note obtiendrait une journée typique à ${city} chaque mois ? C’est le même calcul que fait le planificateur pour un voyage dans plus de 15 jours : les moyennes ${from}–${to}, le risque de pluie étant le nombre moyen de jours de pluie divisé par 30.`,
    exampleOutro: ({ best, bestScore, worst, worstScore, rainOnly }) => `${best} obtient la meilleure note (${bestScore}) et ${worst} la plus basse (${worstScore}).${rainOnly ? ' L’écart vient uniquement de la pluie : les températures n’atteignent jamais un niveau qui coûte des points.' : ''}`,
    cols: { month: 'Mois', high: 'Max. moyen', rain: 'Risque de pluie', score: 'Note du jour' },
    useTitle: 'À quoi il sert',
    uses: [
      ['City-trips', 'Placez visites à pied et marchés les jours les plus secs, gardez les musées pour les jours de pluie.'],
      ['Séjours à la plage', 'Le planificateur ne propose la plage que les jours chauds et secs, dans les villes côtières.'],
      ['Randonnée', 'L’orage et le vent fort font vite baisser la note : gardez les longs sentiers pour les jours calmes.'],
    ],
    faq: [
      ['Combien de temps à l’avance puis-je planifier un voyage ?', 'Vous pouvez choisir n’importe quelles dates. Jusqu’à 15 jours à l’avance, vous avez la prévision en direct ; au-delà, le planificateur affiche une estimation tirée de 20 ans de données climatiques pour les mêmes dates.'],
      ['Que signifie la note du jour ?', 'Elle évalue de 1 à 10 si la météo se prête à une journée dehors : 8,5–10 est excellent, 7–8,4 bon, 5–6,9 moyen et moins de 5 mauvais.'],
      ['Un risque de pluie de 40 % gâche-t-il la journée ?', 'Pas à lui seul. Il coûte environ 1,6 point, la journée peut donc rester bonne. Si la prévision montre aussi plusieurs heures de pluie ou de fortes averses, la note baisse davantage.'],
      ['Puis-je planifier un voyage dans tout un pays ?', 'Oui. Passez en mode pays pour comparer ses villes à vos dates, puis ouvrez une ville pour le plan jour par jour.'],
      ['Combien de jours peut durer un voyage ?', 'Jusqu’à 20 jours dans un même plan.'],
    ],
  },
  events: {
    scoreTitle: 'Comment fonctionne le risque météo d’un événement',
    score: [
      'Choisissez le type d’événement, le lieu et la date, jusqu’à 10 jours à l’avance, et si vous voulez une heure de début. L’outil lit la prévision heure par heure et note une plage de 3 heures de 0 à 10. Plus le chiffre est élevé, plus la météo risque de perturber votre événement.',
      'Quatre éléments augmentent le risque. Chaque tranche de 10 % de risque de pluie ajoute 1 point. Le vent ajoute 1 point au-delà de 15 km/h, 2 au-delà de 25 km/h et 4 au-delà de 40 km/h. La température ajoute 1 point sous 10 °C, 3 sous 5 °C, 2 au-delà de 32 °C et 4 au-delà de 38 °C. L’humidité ajoute 1 point au-delà de 60 % et 2 au-delà de 80 %.',
      'Chaque type d’événement pondère ces éléments différemment. Pour un mariage, la pluie compte 1,5 fois ; pour un marathon, la chaleur 1,6 fois et l’humidité 1,4 fois ; pour un concert, le vent 1,5 fois. Pour les festivals, la pluie compte 1,3 fois, et 1,4 fois pour les pique-niques et barbecues. Jusqu’à 3, le risque est faible, jusqu’à 6 modéré, au-delà de 6 élevé. L’outil montre aussi le meilleur créneau du jour et la comparaison avec les jours voisins.',
    ],
    exampleTitle: (city) => `Exemple : un mariage à ${city}`,
    exampleIntro: (city, from, to) => `L’outil a besoin d’une vraie prévision : il ne fonctionne donc que jusqu’à 10 jours à l’avance. Pour montrer comment réagit la note, voici la formule du mariage appliquée à une journée moyenne à ${city} pour chaque mois (moyennes ${from}–${to} : risque de pluie = jours de pluie divisés par 30, maximum et humidité habituels de l’après-midi, sans vent).`,
    exampleOutro: ({ lowMonths, lowScore, high, highScore }) => `${lowMonths} donnent un risque faible (${lowScore}), alors que ${high} atteint ${highScore}. Comme la pluie compte 1,5 fois pour un mariage, un mois humide devient vite à risque élevé. Le jour venu, c’est la prévision horaire de vos heures qui décide.`,
    cols: { month: 'Mois', rain: 'Risque de pluie', high: 'Max. moyen', humidity: 'Humidité', risk: 'Risque mariage' },
    levels: { low: 'faible', moderate: 'modéré', high: 'élevé' },
    useTitle: 'À quoi il sert',
    uses: [
      ['Mariages', 'Vérifiez les heures de la cérémonie et des photos, et réservez une tente si le risque est modéré.'],
      ['Concerts', 'Pour une scène en plein air et le son, c’est le vent qui compte le plus.'],
      ['Marathons', 'Pour les coureurs, chaleur et humidité comptent le plus : l’heure de départ est importante.'],
      ['Festivals', 'Pour un festival de plusieurs jours, vérifiez chaque jour séparément.'],
      ['Barbecues et fêtes au jardin', 'Choisissez « Pique-nique/Barbecue » : la pluie compte 1,4 fois et le vent 1,2 fois.'],
    ],
    faq: [
      ['Combien de temps à l’avance puis-je vérifier la météo pour la date de mon mariage ?', 'Jusqu’à 10 jours à l’avance, car la note a besoin d’une vraie prévision horaire. Pour une date plus lointaine, la page du mois de votre ville indique à quelle fréquence il pleut à cette période.'],
      ['Quel est le risque de pluie le jour de mon événement ?', 'L’outil affiche le risque de pluie prévu pour chaque heure de votre créneau et ajoute 1 point de risque par tranche de 10 %, pondéré selon le type d’événement.'],
      ['Que signifient risque faible, modéré et élevé ?', 'Faible (0–3) : maintenez votre plan. Modéré (jusqu’à 6) : prévoyez une solution de repli, comme une tente ou une salle. Élevé (au-delà de 6) : envisagez une autre heure ou un autre jour ; l’outil propose de meilleurs créneaux.'],
      ['Pourquoi le risque diffère-t-il pour un mariage et un marathon ?', 'Chaque événement pondère la météo différemment. La pluie compte le plus pour un mariage, la chaleur et l’humidité pour les coureurs.'],
      ['Quel est le meilleur moment de la journée pour un événement en plein air ?', 'Cela dépend de la prévision. L’outil note chaque créneau de 3 heures à partir de 6 h et montre celui au risque le plus faible.'],
    ],
  },
  citiesTitle: 'Villes populaires',
  blogTitle: 'Guides associés',
};

const it = {
  trip: {
    scoreTitle: 'Come funziona il punteggio del pianificatore',
    score: [
      'Inserisci una città o un intero paese e le date del viaggio, fino a 20 giorni. Se il viaggio finisce entro i prossimi 15 giorni, il pianificatore usa la previsione oraria aggiornata. Se è più lontano, usa 20 anni di dati climatici per le stesse date e indica il risultato come stima, non come previsione.',
      'Ogni giorno riceve un punteggio da 1 a 10. Si parte da 10 e si perdono punti per il meteo che rovina una giornata fuori. Una probabilità di pioggia oltre il 20% costa fino a 5 punti, ogni ora di pioggia di giorno costa 0,4, ogni millimetro di pioggia 0,15 (al massimo 3 punti per la quantità di pioggia) e un temporale costa 2 punti. Il vento oltre i 20 km/h costa fino a 2 punti. Il caldo oltre i 32 °C o il freddo sotto i 5 °C costa 1 punto; oltre i 38 °C o sotto 0 °C ne costa 2. Un giorno con l’icona della pioggia non supera mai 8,4.',
      'Eccellente va da 8,5 a 10, buono da 7 a 8,4, discreto da 5 a 6,9 e scarso sotto 5. Una buona giornata ha 7 o più: poca pioggia, poco vento e temperature piacevoli. Per ogni giorno vedi anche mattina, pomeriggio e sera, l’attività più adatta e una breve lista di cose da portare.',
    ],
    exampleTitle: (city) => `Esempio: ${city} durante l’anno`,
    exampleIntro: (city, from, to) => `Che punteggio avrebbe una giornata tipica a ${city} in ogni mese? È lo stesso calcolo che il pianificatore fa per i viaggi tra più di 15 giorni: le medie ${from}–${to}, con la probabilità di pioggia pari al numero medio di giorni di pioggia diviso 30.`,
    exampleOutro: ({ best, bestScore, worst, worstScore, rainOnly }) => `${best} ottiene il punteggio migliore (${bestScore}) e ${worst} il più basso (${worstScore}).${rainOnly ? ' La differenza dipende solo dalla pioggia: le temperature non arrivano mai a un livello che costa punti.' : ''}`,
    cols: { month: 'Mese', high: 'Massima media', rain: 'Probabilità di pioggia', score: 'Punteggio' },
    useTitle: 'Per cosa si usa',
    uses: [
      ['Weekend in città', 'Metti tour a piedi e mercati nei giorni più asciutti e lascia i musei per quelli piovosi.'],
      ['Vacanze al mare', 'Il pianificatore propone la spiaggia solo nei giorni caldi e asciutti delle città di mare.'],
      ['Escursioni', 'Temporali e vento forte abbassano subito il punteggio: i sentieri lunghi vanno nei giorni calmi.'],
    ],
    faq: [
      ['Con quanto anticipo posso pianificare un viaggio?', 'Puoi scegliere qualsiasi data. Fino a 15 giorni prima hai la previsione aggiornata; per i viaggi più lontani il pianificatore mostra una stima da 20 anni di dati climatici per le stesse date.'],
      ['Cosa significa il punteggio del giorno?', 'Indica da 1 a 10 quanto il meteo è adatto a stare fuori: 8,5–10 è eccellente, 7–8,4 buono, 5–6,9 discreto e sotto 5 scarso.'],
      ['Una probabilità di pioggia del 40% rovina la giornata?', 'Da sola no. Costa circa 1,6 punti, quindi la giornata può restare buona. Se la previsione mostra anche diverse ore di pioggia o piogge forti, il punteggio scende ancora.'],
      ['Posso pianificare un viaggio in un intero paese?', 'Sì. Passa alla modalità paese per confrontare le sue città nelle tue date, poi apri una città per il piano giorno per giorno.'],
      ['Quanti giorni può durare un viaggio?', 'Fino a 20 giorni in un solo piano.'],
    ],
  },
  events: {
    scoreTitle: 'Come funziona il rischio meteo per gli eventi',
    score: [
      'Scegli il tipo di evento, il luogo e la data, fino a 10 giorni prima, e se vuoi un orario di inizio. Lo strumento legge la previsione oraria e valuta una fascia di 3 ore da 0 a 10. Più alto è il numero, più il meteo può disturbare il tuo evento.',
      'Quattro fattori aumentano il rischio. Ogni 10% di probabilità di pioggia aggiunge 1 punto. Il vento aggiunge 1 punto oltre i 15 km/h, 2 oltre i 25 km/h e 4 oltre i 40 km/h. La temperatura aggiunge 1 punto sotto i 10 °C, 3 sotto i 5 °C, 2 oltre i 32 °C e 4 oltre i 38 °C. L’umidità aggiunge 1 punto oltre il 60% e 2 oltre l’80%.',
      'Ogni tipo di evento pesa questi fattori in modo diverso. Per un matrimonio la pioggia conta 1,5 volte, per una maratona il caldo 1,6 volte e l’umidità 1,4 volte, per un concerto il vento 1,5 volte. Per i festival la pioggia conta 1,3 volte, per picnic e grigliate 1,4 volte. Fino a 3 il rischio è basso, fino a 6 moderato e oltre 6 alto. Lo strumento mostra anche la fascia oraria migliore del giorno e il confronto con i giorni vicini.',
    ],
    exampleTitle: (city) => `Esempio: un matrimonio a ${city}`,
    exampleIntro: (city, from, to) => `Lo strumento ha bisogno di una previsione vera, quindi funziona solo fino a 10 giorni prima. Per mostrare come si comporta il punteggio, ecco la formula del matrimonio applicata a una giornata media a ${city} in ogni mese (medie ${from}–${to}: probabilità di pioggia = giorni di pioggia diviso 30, massima e umidità tipiche del pomeriggio, senza vento).`,
    exampleOutro: ({ lowMonths, lowScore, high, highScore }) => `${lowMonths} risultano a basso rischio (${lowScore}), mentre ${high} arriva a ${highScore}. Dato che per un matrimonio la pioggia conta 1,5 volte, un mese piovoso diventa presto ad alto rischio. Il giorno stesso decide la previsione oraria delle ore scelte.`,
    cols: { month: 'Mese', rain: 'Probabilità di pioggia', high: 'Massima media', humidity: 'Umidità', risk: 'Rischio matrimonio' },
    levels: { low: 'basso', moderate: 'moderato', high: 'alto' },
    useTitle: 'Per cosa si usa',
    uses: [
      ['Matrimoni', 'Controlla le ore della cerimonia e delle foto e prenota un gazebo se il rischio è moderato.'],
      ['Concerti', 'Per palchi all’aperto e audio conta soprattutto il vento.'],
      ['Maratone', 'Per chi corre contano soprattutto caldo e umidità, quindi l’orario di partenza è importante.'],
      ['Festival', 'Per un festival di più giorni controlla ogni giorno separatamente.'],
      ['Grigliate e feste in giardino', 'Scegli “Picnic/Grigliata”: la pioggia conta 1,4 volte e il vento 1,2 volte.'],
    ],
    faq: [
      ['Con quanto anticipo posso controllare il meteo per la data del mio matrimonio?', 'Fino a 10 giorni prima, perché il punteggio ha bisogno di una vera previsione oraria. Per una data più lontana, la pagina del mese della tua città mostra quanto spesso piove in quel periodo.'],
      ['Qual è la probabilità di pioggia nel giorno del mio evento?', 'Lo strumento mostra la probabilità di pioggia prevista per ogni ora della tua fascia e aggiunge 1 punto di rischio ogni 10%, pesato secondo il tipo di evento.'],
      ['Cosa significano rischio basso, moderato e alto?', 'Basso (0–3): procedi come previsto. Moderato (fino a 6): prepara un’alternativa, come un gazebo o un locale al chiuso. Alto (oltre 6): valuta un altro orario o un altro giorno; lo strumento suggerisce fasce migliori.'],
      ['Perché il rischio è diverso per un matrimonio e una maratona?', 'Ogni evento pesa il meteo in modo diverso. Per un matrimonio conta di più la pioggia, per chi corre il caldo e l’umidità.'],
      ['Qual è il momento migliore della giornata per un evento all’aperto?', 'Dipende dalla previsione. Lo strumento valuta ogni fascia di 3 ore dalle 6 del mattino e mostra quella con il rischio più basso.'],
    ],
  },
  citiesTitle: 'Città più cercate',
  blogTitle: 'Guide correlate',
};

const es = {
  trip: {
    scoreTitle: 'Cómo funciona la puntuación del planificador',
    score: [
      'Introduce una ciudad o un país entero y las fechas de tu viaje, hasta 20 días. Si el viaje termina en los próximos 15 días, el planificador usa la previsión por horas actualizada. Si es más adelante, usa 20 años de datos climáticos de esas mismas fechas y marca el resultado como estimación, no como previsión.',
      'Cada día recibe una puntuación del 1 al 10. Empieza en 10 y pierde puntos por el tiempo que estropea un día fuera. Una probabilidad de lluvia superior al 20 % resta hasta 5 puntos, cada hora de lluvia durante el día resta 0,4, cada milímetro de lluvia 0,15 (como máximo 3 puntos por la cantidad de lluvia) y una tormenta resta 2. El viento de más de 20 km/h resta hasta 2 puntos. El calor por encima de 32 °C o el frío por debajo de 5 °C resta 1 punto; por encima de 38 °C o por debajo de 0 °C, 2. Un día cuyo icono muestra lluvia nunca supera 8,4.',
      'Excelente es de 8,5 a 10, bueno de 7 a 8,4, regular de 5 a 6,9 y malo por debajo de 5. Un buen día tiene 7 o más: poca lluvia, poco viento y temperaturas agradables. Para cada día ves además la mañana, la tarde y la noche, la actividad que mejor encaja y una breve lista de equipaje.',
    ],
    exampleTitle: (city) => `Ejemplo: ${city} a lo largo del año`,
    exampleIntro: (city, from, to) => `¿Qué puntuación tendría un día típico en ${city} cada mes? Es el mismo cálculo que hace el planificador para viajes a más de 15 días vista: las medias ${from}–${to}, con la probabilidad de lluvia igual al número medio de días de lluvia dividido entre 30.`,
    exampleOutro: ({ best, bestScore, worst, worstScore, rainOnly }) => `${best} sale mejor (${bestScore}) y ${worst} peor (${worstScore}).${rainOnly ? ' La diferencia se debe solo a la lluvia: las temperaturas nunca llegan a un nivel que reste puntos.' : ''}`,
    cols: { month: 'Mes', high: 'Máxima media', rain: 'Probabilidad de lluvia', score: 'Puntuación' },
    useTitle: 'Para qué se usa',
    uses: [
      ['Escapadas urbanas', 'Deja los paseos y mercados para los días más secos y los museos para los de lluvia.'],
      ['Viajes de playa', 'El planificador solo propone playa en días cálidos y secos de ciudades costeras.'],
      ['Senderismo', 'Las tormentas y el viento fuerte bajan la puntuación enseguida: las rutas largas, en días tranquilos.'],
    ],
    faq: [
      ['¿Con cuánta antelación puedo planificar un viaje?', 'Puedes elegir cualquier fecha. Hasta 15 días antes tienes la previsión actualizada; para viajes posteriores el planificador muestra una estimación con 20 años de datos climáticos de las mismas fechas.'],
      ['¿Qué significa la puntuación del día?', 'Valora del 1 al 10 lo bueno que es el tiempo para estar al aire libre: de 8,5 a 10 es excelente, de 7 a 8,4 bueno, de 5 a 6,9 regular y por debajo de 5 malo.'],
      ['¿Un 40 % de probabilidad de lluvia es un mal día?', 'Por sí solo no. Resta unos 1,6 puntos, así que el día puede seguir siendo bueno. Si la previsión también muestra varias horas de lluvia o lluvia fuerte, la puntuación baja más.'],
      ['¿Puedo planificar un viaje por todo un país?', 'Sí. Cambia al modo país para comparar sus ciudades en tus fechas y luego abre una ciudad para ver el plan día a día.'],
      ['¿Cuántos días puede tener un viaje?', 'Hasta 20 días en un mismo plan.'],
    ],
  },
  events: {
    scoreTitle: 'Cómo funciona el riesgo meteorológico de un evento',
    score: [
      'Elige el tipo de evento, el lugar y la fecha, hasta 10 días antes, y si quieres una hora de inicio. La herramienta lee la previsión por horas y puntúa una franja de 3 horas del 0 al 10. Cuanto más alto el número, más puede alterar el tiempo tu evento.',
      'Cuatro factores suman riesgo. Cada 10 % de probabilidad de lluvia suma 1 punto. El viento suma 1 punto por encima de 15 km/h, 2 por encima de 25 km/h y 4 por encima de 40 km/h. La temperatura suma 1 punto por debajo de 10 °C, 3 por debajo de 5 °C, 2 por encima de 32 °C y 4 por encima de 38 °C. La humedad suma 1 punto por encima del 60 % y 2 por encima del 80 %.',
      'Cada tipo de evento pondera estos factores de forma distinta. En una boda la lluvia cuenta 1,5 veces; en un maratón el calor cuenta 1,6 veces y la humedad 1,4; en un concierto el viento cuenta 1,5 veces. En los festivales la lluvia cuenta 1,3 veces, y en pícnics y barbacoas 1,4 veces. Hasta 3 el riesgo es bajo, hasta 6 moderado y por encima de 6 alto. La herramienta también muestra la mejor franja del día y cómo salen los días cercanos.',
    ],
    exampleTitle: (city) => `Ejemplo: una boda en ${city}`,
    exampleIntro: (city, from, to) => `La herramienta necesita una previsión real, por eso solo funciona hasta 10 días antes. Para ver cómo se comporta la puntuación, esta es la fórmula de la boda aplicada a un día medio en ${city} en cada mes (medias ${from}–${to}: probabilidad de lluvia = días de lluvia entre 30, máxima y humedad habituales de la tarde, sin viento).`,
    exampleOutro: ({ lowMonths, lowScore, high, highScore }) => `${lowMonths} salen con riesgo bajo (${lowScore}), mientras que ${high} llega a ${highScore}. Como en una boda la lluvia cuenta 1,5 veces, un mes húmedo pasa enseguida a riesgo alto. El propio día decide la previsión por horas de tu franja.`,
    cols: { month: 'Mes', rain: 'Probabilidad de lluvia', high: 'Máxima media', humidity: 'Humedad', risk: 'Riesgo boda' },
    levels: { low: 'bajo', moderate: 'moderado', high: 'alto' },
    useTitle: 'Para qué se usa',
    uses: [
      ['Bodas', 'Revisa las horas de la ceremonia y las fotos, y reserva una carpa si el riesgo es moderado.'],
      ['Conciertos', 'En escenarios al aire libre y para el sonido, el viento es lo que más cuenta.'],
      ['Maratones', 'Para los corredores cuentan sobre todo el calor y la humedad, así que la hora de salida importa.'],
      ['Festivales', 'En un festival de varios días, revisa cada día por separado.'],
      ['Barbacoas y fiestas en el jardín', 'Elige «Picnic/Barbacoa»: la lluvia cuenta 1,4 veces y el viento 1,2 veces.'],
    ],
    faq: [
      ['¿Con cuánta antelación puedo consultar el tiempo para el día de mi boda?', 'Hasta 10 días antes, porque la puntuación necesita una previsión real por horas. Para una fecha más lejana, la página del mes de tu ciudad muestra con qué frecuencia llueve en esa época.'],
      ['¿Qué probabilidad de lluvia hay el día de mi evento?', 'La herramienta muestra la probabilidad de lluvia prevista para cada hora de tu franja y suma 1 punto de riesgo por cada 10 %, ponderado según el tipo de evento.'],
      ['¿Qué significan riesgo bajo, moderado y alto?', 'Bajo (0–3): sigue con tu plan. Moderado (hasta 6): ten una alternativa, como una carpa o un espacio interior. Alto (más de 6): piensa en otra hora u otro día; la herramienta sugiere franjas mejores.'],
      ['¿Por qué el riesgo es distinto para una boda y un maratón?', 'Cada evento pondera el tiempo de forma distinta. En una boda lo que más cuenta es la lluvia; para los corredores, el calor y la humedad.'],
      ['¿Cuál es la mejor hora del día para un evento al aire libre?', 'Depende de la previsión. La herramienta puntúa cada franja de 3 horas desde las 6 de la mañana y muestra la de menor riesgo.'],
    ],
  },
  citiesTitle: 'Ciudades populares',
  blogTitle: 'Guías relacionadas',
};

const ja = {
  trip: {
    scoreTitle: '旅行プランナーのスコアの仕組み',
    score: [
      '都市または国全体と、旅行の日程（最長20日間）を入力します。旅行が15日以内に終わる場合は、最新の1時間ごとの予報を使います。それより先の旅行では、同じ日付の20年分の気候データを使い、「予報」ではなく「推定」として表示します。',
      '各日には1〜10のスコアが付きます。10点から始まり、外で過ごす一日を台無しにする天気ごとに点が引かれます。降水確率が20%を超えると最大5点、日中の雨の時間は1時間ごとに0.4点、雨量は1mmごとに0.15点（雨量分は最大3点）、雷雨で2点が引かれます。風速が20km/hを超えると最大2点。32℃を超える暑さや5℃未満の寒さは1点、38℃超や0℃未満は2点です。雨のアイコンが付いた日は、8.4点を超えることはありません。',
      '8.5〜10は「最高」、7〜8.4は「良い」、5〜6.9は「まずまず」、5未満は「不向き」です。良い日とは7点以上、つまり雨が少なく、風が弱く、気温が快適な日です。各日について、朝・昼・夕方の様子、天気に合ったおすすめの過ごし方、簡単な持ち物リストも表示されます。',
    ],
    exampleTitle: (city) => `例：${city}の1年`,
    exampleIntro: (city, from, to) => `${city}のふつうの一日は、月ごとに何点になるでしょうか。これは、プランナーが15日より先の旅行で行う計算と同じです。${from}〜${to}年の平均を使い、降水確率は平均の雨の日数を30で割った値としています。`,
    exampleOutro: ({ best, bestScore, worst, worstScore, rainOnly }) => `最も高いのは${best}（${bestScore}点）、最も低いのは${worst}（${worstScore}点）です。${rainOnly ? 'この差は雨だけによるもので、気温が減点の対象になる月はありません。' : ''}`,
    cols: { month: '月', high: '平均最高気温', rain: '降水確率', score: 'スコア' },
    useTitle: 'こんな使い方',
    uses: [
      ['街歩き旅行', '街歩きやマーケットは雨の少ない日に、美術館や博物館は雨の日に回せます。'],
      ['ビーチ旅行', 'ビーチをすすめるのは、海沿いの都市で暖かく雨の少ない日だけです。'],
      ['ハイキング', '雷や強風があるとスコアはすぐに下がります。長いコースは穏やかな日に。'],
    ],
    faq: [
      ['旅行はどのくらい先まで計画できますか？', '日程は自由に選べます。15日先までは最新の予報、それより先の旅行では同じ日付の20年分の気候データにもとづく推定を表示します。'],
      ['一日のスコアは何を表していますか？', '外で過ごすのに天気がどれだけ向いているかを1〜10で表します。8.5〜10は最高、7〜8.4は良い、5〜6.9はまずまず、5未満は不向きです。'],
      ['降水確率40%の日は悪い日ですか？', 'それだけでは悪い日ではありません。減点は約1.6点なので、良い日のままのこともあります。予報で雨の時間が長い場合や強い雨の場合は、さらにスコアが下がります。'],
      ['国全体の旅行も計画できますか？', 'はい。国モードに切り替えると、日程に合わせてその国の都市を比べられます。都市を選ぶと日ごとのプランが表示されます。'],
      ['1回の旅行は何日まで設定できますか？', '1つのプランで最長20日間です。'],
    ],
  },
  events: {
    scoreTitle: 'イベントの天気リスクの仕組み',
    score: [
      'イベントの種類、場所、日付（10日先まで）を選び、必要なら開始時刻も入力します。1時間ごとの予報をもとに、3時間の枠を0〜10で評価します。数字が大きいほど、天気がイベントに影響する可能性が高くなります。',
      'リスクを上げる要素は4つです。降水確率は10%ごとに1点。風は15km/h超で1点、25km/h超で2点、40km/h超で4点。気温は10℃未満で1点、5℃未満で3点、32℃超で2点、38℃超で4点。湿度は60%超で1点、80%超で2点です。',
      'イベントの種類によって、これらの重みが変わります。結婚式では雨が1.5倍、マラソンでは暑さが1.6倍・湿度が1.4倍、コンサートでは風が1.5倍です。フェスティバルでは雨が1.3倍、ピクニック・BBQでは1.4倍です。3以下は低リスク、6以下は中リスク、6を超えると高リスクです。その日のいちばん良い時間帯と、前後の日との比較も表示されます。',
    ],
    exampleTitle: (city) => `例：${city}での結婚式`,
    exampleIntro: (city, from, to) => `このチェックには実際の予報が必要なため、10日先までしか使えません。スコアの動きを示すために、${city}の各月の平均的な一日に結婚式の計算式を当てはめました（${from}〜${to}年の平均。降水確率は雨の日数を30で割った値、午後の典型的な最高気温と湿度、風はなし）。`,
    exampleOutro: ({ lowMonths, lowScore, high, highScore }) => `${lowMonths}は低リスク（${lowScore}）ですが、${high}は${highScore}になります。結婚式では雨が1.5倍で数えられるため、雨の多い月はすぐに高リスクになります。当日は、選んだ時間帯の1時間ごとの予報で判断されます。`,
    cols: { month: '月', rain: '降水確率', high: '平均最高気温', humidity: '湿度', risk: '結婚式のリスク' },
    levels: { low: '低', moderate: '中', high: '高' },
    useTitle: 'こんな使い方',
    uses: [
      ['結婚式', '挙式と撮影の時間を確認し、中リスクならテントを手配しましょう。'],
      ['コンサート', '野外ステージや音響では、風がいちばん影響します。'],
      ['マラソン', 'ランナーには暑さと湿度がいちばん影響するので、スタート時刻が大切です。'],
      ['フェスティバル', '数日にわたるフェスは、1日ずつ確認しましょう。'],
      ['バーベキューやガーデンパーティー', '「ピクニック・BBQ」を選びましょう。雨は1.4倍、風は1.2倍で数えます。'],
    ],
    faq: [
      ['結婚式の日の天気は、どのくらい前から確認できますか？', '10日前から確認できます。スコアには実際の1時間ごとの予報が必要だからです。それより先の日付は、都市の月別ページで、その時期にどれくらい雨が降るかを確認できます。'],
      ['イベント当日の降水確率はどうやって分かりますか？', 'イベントの時間帯の1時間ごとの降水確率を表示し、10%ごとに1点のリスクを、イベントの種類に応じた重みで加えます。'],
      ['低リスク・中リスク・高リスクはどういう意味ですか？', '低（0〜3）：予定どおりで大丈夫です。中（6まで）：テントや屋内など代わりの案を用意しましょう。高（6超）：別の時間や日を検討してください。より良い時間帯も提案されます。'],
      ['結婚式とマラソンでリスクが違うのはなぜですか？', 'イベントごとに天気の重みが違うからです。結婚式では雨、ランナーには暑さと湿度がいちばん大きく影響します。'],
      ['野外イベントに一番良い時間帯は？', '予報によって変わります。朝6時から3時間ごとの枠をすべて評価し、リスクが最も低い枠を表示します。'],
    ],
  },
  citiesTitle: '人気の都市',
  blogTitle: '関連ガイド',
};

const TEXT = { en, de, fr, it, es, ja };

export const guideText = (lang) => TEXT[lang] || en;

// "Use this data on your site" box ka text, 6 zabanein (Nov 2026). City aur month pages par.
const en = {
  title: 'Use this data on your site',
  intro: 'Free weather widget for your blog or travel guide. Pick the options, copy the code and paste it into your page. No ads, no cookies.',
  widget: 'Widget', year: 'Whole year', language: 'Language', theme: 'Theme', light: 'Light', dark: 'Dark',
  trip: 'Add Trip Planner link', preview: 'Preview', code: 'Embed code', copy: 'Copy code', copied: 'Copied',
  showPreview: 'Show preview', hidePreview: 'Hide preview',
  note: 'Please keep the link under the widget: it shows your readers where the data comes from.',
};
const de = {
  title: 'Diese Daten auf Ihrer Website nutzen',
  intro: 'Kostenloses Wetter-Widget für Ihren Blog oder Reiseführer. Optionen wählen, Code kopieren und in Ihre Seite einfügen. Keine Werbung, keine Cookies.',
  widget: 'Widget', year: 'Ganzes Jahr', language: 'Sprache', theme: 'Design', light: 'Hell', dark: 'Dunkel',
  trip: 'Link zum Reiseplaner hinzufügen', preview: 'Vorschau', code: 'Einbettungscode', copy: 'Code kopieren', copied: 'Kopiert',
  showPreview: 'Vorschau anzeigen', hidePreview: 'Vorschau ausblenden',
  note: 'Bitte lassen Sie den Link unter dem Widget stehen: So sehen Ihre Leser, woher die Daten stammen.',
};
const fr = {
  title: 'Utilisez ces données sur votre site',
  intro: 'Widget météo gratuit pour votre blog ou votre guide de voyage. Choisissez les options, copiez le code et collez-le dans votre page. Sans publicité, sans cookies.',
  widget: 'Widget', year: 'Toute l’année', language: 'Langue', theme: 'Thème', light: 'Clair', dark: 'Sombre',
  trip: 'Ajouter un lien vers le planificateur', preview: 'Aperçu', code: 'Code d’intégration', copy: 'Copier le code', copied: 'Copié',
  showPreview: 'Afficher l’aperçu', hidePreview: 'Masquer l’aperçu',
  note: 'Merci de garder le lien sous le widget : il indique à vos lecteurs d’où viennent les données.',
};
const it = {
  title: 'Usa questi dati sul tuo sito',
  intro: 'Widget meteo gratuito per il tuo blog o la tua guida di viaggio. Scegli le opzioni, copia il codice e incollalo nella tua pagina. Niente pubblicità, niente cookie.',
  widget: 'Widget', year: 'Tutto l’anno', language: 'Lingua', theme: 'Tema', light: 'Chiaro', dark: 'Scuro',
  trip: 'Aggiungi il link al pianificatore', preview: 'Anteprima', code: 'Codice da incorporare', copy: 'Copia il codice', copied: 'Copiato',
  showPreview: 'Mostra anteprima', hidePreview: 'Nascondi anteprima',
  note: 'Lascia il link sotto il widget: mostra ai lettori da dove vengono i dati.',
};
const es = {
  title: 'Usa estos datos en tu web',
  intro: 'Widget del tiempo gratuito para tu blog o guía de viaje. Elige las opciones, copia el código y pégalo en tu página. Sin anuncios ni cookies.',
  widget: 'Widget', year: 'Todo el año', language: 'Idioma', theme: 'Tema', light: 'Claro', dark: 'Oscuro',
  trip: 'Añadir enlace al planificador', preview: 'Vista previa', code: 'Código para insertar', copy: 'Copiar código', copied: 'Copiado',
  showPreview: 'Ver vista previa', hidePreview: 'Ocultar vista previa',
  note: 'Mantén el enlace bajo el widget: muestra a tus lectores de dónde vienen los datos.',
};
const ja = {
  title: 'このデータをあなたのサイトで使う',
  intro: 'ブログや旅行ガイドに使える無料の天気ウィジェットです。オプションを選んでコードをコピーし、ページに貼り付けるだけ。広告も Cookie もありません。',
  widget: 'ウィジェット', year: '1年間', language: '言語', theme: 'テーマ', light: 'ライト', dark: 'ダーク',
  trip: '旅行プランナーへのリンクを追加', preview: 'プレビュー', code: '埋め込みコード', copy: 'コードをコピー', copied: 'コピーしました',
  showPreview: 'プレビューを表示', hidePreview: 'プレビューを閉じる',
  note: 'ウィジェットの下のリンクは残してください。データの出典を読者に示すためのものです。',
};
const TEXT = { en, de, fr, it, es, ja };
export const embedBoxText = (lang) => TEXT[lang] || en;

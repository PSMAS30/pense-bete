/* Pense-bête, version 2 : comportements de la page (aucune dépendance). */

/* ---------- Envoi du programme par e-mail (EmailJS) ----------
   Remplir les trois identifiants donnés par emailjs.com pour activer l'envoi.
   Tant qu'ils sont vides, le formulaire n'envoie rien et affiche simplement
   le message de confirmation avec un lien vers le PDF. */
var EMAILJS = {
  serviceId: 'default_service',   // service par défaut du compte (ici : Gmail)
  templateId: 'template_cqbjsda',  // Email Templates → Template ID (e-mail en français)
  templateIdEn: 'template_7iv6w69', // modèle d'e-mail en anglais (vide = modèle français pour tous)
  publicKey: '4N-aretBTRdhREtLo'    // Account → Public Key
};
var EMAILJS_READY = Boolean(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);

// Signale tout de suite que le JS est actif : le CSS peut replier le menu mobile
// et préparer les animations sans clignotement.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
  initNavigation();
  initHeaderShadow();
  initReveal();
  initStatement();
  initVideoLinks();
  initVideoLanguage();
  initOfferLinks();
  initContactLinks();
  initFormationsLinks();
  initContactForm();
});

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Langue de la vidéo : FR ou EN ----------
   Par défaut, la langue du navigateur ; le choix du visiteur est ensuite mémorisé.
   Changer de langue réinitialise la vidéo : elle revient au début, à l'arrêt. */

var VIDEO_LANGS = {
  fr: { src: 'pense-bete-fr.mp4', caption: '52 secondes avec notre pense-bête préféré.' },
  en: { src: 'pense-bete-en.mp4', caption: '52 seconds with our favourite sticky note.' }
};

function initVideoLanguage() {
  var video = document.getElementById('pub-video');
  var caption = document.getElementById('legende-video');
  var buttons = document.querySelectorAll('.lang-switch [data-lang]');
  if (!video || !buttons.length) return;

  function setLang(lang) {
    var conf = VIDEO_LANGS[lang];
    if (!conf) return;
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    if (caption) { caption.textContent = conf.caption; caption.lang = lang; }
    // Le programme envoyé par e-mail suit la langue de la vidéo, tant que le visiteur n'a pas choisi lui-même
    var radio = document.querySelector('input[name="langue"][value="' + lang + '"]');
    if (radio && !radio.form.dataset.langueChoisie) {
      radio.checked = true;
      refreshPrefill();
    }
    if (video.getAttribute('src') === conf.src) return;

    // Nouvelle source : la vidéo repart de zéro, à l'arrêt, avec son affiche
    video.pause();
    video.setAttribute('src', conf.src);
    video.load();
  }

  var saved = null;
  try { saved = window.localStorage.getItem('pense-bete-langue-video'); } catch (e) { /* stockage indisponible */ }
  var browser = (navigator.language || 'fr').slice(0, 2).toLowerCase();
  setLang(saved || (browser === 'en' ? 'en' : 'fr'));

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      setLang(b.dataset.lang);
      try { window.localStorage.setItem('pense-bete-langue-video', b.dataset.lang); } catch (e) { /* tant pis */ }
    });
  });
}

/* ---------- Menu mobile ---------- */

function initNavigation() {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  var desktop = window.matchMedia('(min-width: 700px)');

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }

  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', function (event) {
    if (!event.target.closest('.site-header')) setOpen(false);
  });

  var onChange = function () { if (desktop.matches) setOpen(false); };
  if (desktop.addEventListener) desktop.addEventListener('change', onChange);
  else if (desktop.addListener) desktop.addListener(onChange);
}

/* ---------- Ombre de l'en-tête une fois la page défilée ---------- */

function initHeaderShadow() {
  var header = document.querySelector('.site-header');
  if (!header) return;
  var update = function () { header.classList.toggle('is-scrolled', window.scrollY > 40); };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ---------- Apparition des post-it ---------- */

function initReveal() {
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  function show(el) {
    el.classList.add('is-visible');
    el.addEventListener('transitionend', function () {
      el.classList.add('is-done');
    }, { once: true });
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible', 'is-done'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        show(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach(function (el) { observer.observe(el); });
}

/* ---------- La phrase de conviction s'éclaire mot à mot au défilement ---------- */

function initStatement() {
  var el = document.querySelector('[data-words]');
  if (!el) return;

  // Expressions mises en valeur en jaune une fois éclairées
  var keys = ['la question à poser.', 'dès le lendemain.', 'les limites'];

  var words = el.textContent.trim().split(' ');
  var text = words.join(' ').toLowerCase();
  var keyRanges = keys.map(function (k) {
    var start = text.indexOf(k);
    return [start, start + k.length];
  });

  el.textContent = '';
  var pos = 0;
  var spans = words.map(function (word, i) {
    var span = document.createElement('span');
    span.className = 'w';
    span.textContent = word;
    var isKey = keyRanges.some(function (r) { return r[0] !== -1 && pos >= r[0] && pos < r[1]; });
    if (isKey) span.classList.add('is-key');
    pos += word.length + 1;
    el.appendChild(span);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    return span;
  });

  if (reduceMotion) {
    spans.forEach(function (s) { s.classList.add('is-lit'); });
    return;
  }

  var ticking = false;
  function update() {
    ticking = false;
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight;
    // 0 quand la phrase entre par le bas, 1 quand elle atteint le tiers haut de l'écran
    var progress = (vh * 0.9 - rect.top) / (rect.height + vh * 0.45);
    progress = Math.max(0, Math.min(1, progress));
    var lit = Math.round(progress * spans.length);
    spans.forEach(function (s, i) { s.classList.toggle('is-lit', i < lit); });
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

/* ---------- Centrer un élément dans l'espace visible sous l'en-tête fixe ----------
   S'il est plus haut que l'écran, il est calé juste sous l'en-tête. */

function centerInView(el, smooth) {
  var header = document.querySelector('.site-header');
  var headerH = header ? header.offsetHeight : 0;
  var rect = el.getBoundingClientRect();
  var free = window.innerHeight - headerH;
  var gap = rect.height < free ? (free - rect.height) / 2 : 12;
  var top = window.scrollY + rect.top - headerH - gap;
  window.scrollTo({ top: Math.max(0, top), behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
}

/* ---------- Liens « La pub » : la vidéo arrive au centre de l'écran ---------- */

function initVideoLinks() {
  var frame = document.getElementById('la-pub');
  var player = frame && frame.querySelector('.video-ratio');
  if (!frame || !player) return;

  // Centre la vidéo (sans sa légende) dans l'espace visible sous l'en-tête fixe
  function centerVideo(smooth) {
    centerInView(player, smooth);
    frame.focus({ preventScroll: true });
  }

  document.querySelectorAll('a[href="#la-pub"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      centerVideo(true);
      if (history.replaceState) history.replaceState(null, '', '#la-pub');
    });
  });

  // Arrivée directe sur la page avec l'adresse …#la-pub
  if (window.location.hash === '#la-pub') {
    window.addEventListener('load', function () { centerVideo(false); });
  }
}

/* ---------- Boutons « Demander le programme » ----------
   Le message pré-rempli est rédigé dans la langue choisie pour le programme ;
   il suit les changements de langue tant que le visiteur ne l'a pas modifié. */

var OFFRES_EN = {
  'Premiers pas': 'First steps',
  'Au quotidien': 'Everyday AI',
  "Référent IA d'équipe": 'Team AI champion'
};

function prefillText(offre, lang) {
  if (lang === 'en') {
    return 'Hello, I would like to receive the programme for the "' + (OFFRES_EN[offre] || offre) + '" course.';
  }
  return 'Bonjour, je souhaite recevoir le programme de la formation « ' + offre + ' ».';
}

function currentProgrammeLang() {
  var checked = document.querySelector('input[name="langue"]:checked');
  return checked && checked.value === 'en' ? 'en' : 'fr';
}

// Retraduit le message pré-rempli si la langue change (appelée aussi par le sélecteur de la vidéo)
function refreshPrefill() {
  var message = document.getElementById('message');
  if (message && message.dataset.prefilled === 'true' && message.dataset.offre) {
    message.value = prefillText(message.dataset.offre, currentProgrammeLang());
  }
}

function initOfferLinks() {
  var message = document.getElementById('message');
  if (!message) return;

  document.querySelectorAll('[data-offre]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (!message.value.trim() || message.dataset.prefilled === 'true') {
        message.dataset.offre = link.dataset.offre;
        message.dataset.prefilled = 'true';
        message.value = prefillText(link.dataset.offre, currentProgrammeLang());
      }
    });
  });

  document.querySelectorAll('input[name="langue"]').forEach(function (radio) {
    radio.addEventListener('change', refreshPrefill);
  });

  message.addEventListener('input', function () {
    message.dataset.prefilled = 'false';
  });
}

/* ---------- Liens « Contact » et « Demander le programme » ----------
   Les liens gardent leur adresse #contact ; au clic, le formulaire arrive
   directement au centre de l'écran et le curseur se place dans le premier champ vide. */

function initContactLinks() {
  var form = document.getElementById('contact-form');
  if (!form) return;

  function goToForm(smooth) {
    centerInView(form, smooth);
    var first = ['nom', 'email', 'message']
      .map(function (n) { return form.elements[n]; })
      .filter(function (f) { return !f.value.trim(); })[0] || form.elements.nom;
    // On attend la fin du défilement avant de placer le curseur
    window.setTimeout(function () { first.focus({ preventScroll: true }); }, smooth && !reduceMotion ? 650 : 0);
  }

  document.querySelectorAll('a[href="#contact"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      goToForm(true);
      if (history.replaceState) history.replaceState(null, '', '#contact');
    });
  });

  // Arrivée directe sur la page avec l'adresse …#contact
  if (window.location.hash === '#contact') {
    window.addEventListener('load', function () { goToForm(false); });
  }
}

/* ---------- Liens « Nos formations » ----------
   Le titre de la section et les trois cartes arrivent au centre de l'écran
   (sur mobile, le titre est calé sous l'en-tête car l'ensemble dépasse l'écran). */

function initFormationsLinks() {
  var block = document.querySelector('#formations .container');
  var title = document.getElementById('titre-formations');
  if (!block) return;

  function goToFormations(smooth) {
    centerInView(block, smooth);
    if (title) {
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
    }
  }

  document.querySelectorAll('a[href="#formations"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      goToFormations(true);
      if (history.replaceState) history.replaceState(null, '', '#formations');
    });
  });

  if (window.location.hash === '#formations') {
    window.addEventListener('load', function () { goToFormations(false); });
  }
}

/* ---------- Formulaire de contact ---------- */

// Adresse complète du PDF dans la langue choisie, pour le lien placé dans l'e-mail
function pdfAddress(lang) {
  var file = lang === 'en' ? 'programme-formations-en.pdf' : 'programme-formations.pdf';
  return new URL(file, window.location.href).href;
}

// Envoi via l'API d'EmailJS (aucune bibliothèque externe)
function sendWithEmailJS(data) {
  return fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS.serviceId,
      template_id: (data.langue === 'en' && EMAILJS.templateIdEn) || EMAILJS.templateId,
      user_id: EMAILJS.publicKey,
      template_params: {
        nom: data.nom,
        name: data.nom, // même valeur, pour les modèles EmailJS qui utilisent {{name}}
        email: data.email,
        message: data.message,
        langue: data.langue,
        lien_programme: pdfAddress(data.langue)
      }
    })
  }).then(function (response) {
    if (response.ok) return;
    // La raison donnée par EmailJS s'affiche dans la console (F12) pour le diagnostic
    return response.text().then(function (reason) {
      console.warn('EmailJS a refusé l\'envoi (' + response.status + ') : ' + reason);
      throw new Error('Envoi refusé (' + response.status + ')');
    });
  });
}

function initContactForm() {
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');
  var note = document.getElementById('form-note');
  if (!form || !status) return;

  var submit = form.querySelector('[type="submit"]');
  var submitLabel = submit.textContent;

  if (note) {
    note.textContent = EMAILJS_READY
      ? 'Votre adresse sert uniquement à vous envoyer le programme et à vous répondre.'
      : 'Aucun message n\'est réellement envoyé.';
  }

  function pdfLink(text, english) {
    var a = document.createElement('a');
    a.href = english ? 'programme-formations-en.pdf' : 'programme-formations.pdf';
    a.target = '_blank';
    a.rel = 'noopener';
    if (english) a.lang = 'en';
    a.textContent = text;
    return a;
  }

  // Lien vers le programme dans l'autre langue, ajouté à chaque message
  function otherVersion(lang) {
    var span = document.createElement('span');
    span.append(' · ', lang === 'en'
      ? pdfLink('Version française (PDF)', false)
      : pdfLink('English version (PDF)', true));
    return span;
  }

  // Le visiteur a choisi lui-même la langue du programme : on ne la change plus avec la vidéo
  form.addEventListener('change', function (event) {
    if (event.target.name === 'langue') form.dataset.langueChoisie = 'true';
  });

  function success(email, lang) {
    form.reset();
    form.elements.langue.value = lang;  // on garde la langue choisie après l'envoi
    form.elements.message.dataset.prefilled = 'false';
    Object.keys(rules).forEach(function (name) {
      form.elements[name].removeAttribute('aria-invalid');
    });
    status.textContent = '';
    status.className = 'form-status is-success';
    var version = lang === 'en' ? ' (version anglaise)' : '';
    if (EMAILJS_READY) {
      status.textContent = 'Merci, on vous répond dès demain. Le programme détaillé' + version + ' vient de partir à ' + email + '.';
    } else {
      status.append('Merci, on vous répond dès demain. En attendant, voici ',
        pdfLink('le programme détaillé' + version + ' (PDF, 3 pages)', lang === 'en'), '.');
    }
    status.append(otherVersion(lang));
  }

  function failure(lang) {
    status.textContent = '';
    status.className = 'form-status is-error';
    status.append('L\'envoi n\'a pas abouti. Réessayez dans un instant, ou ouvrez directement ',
      pdfLink('le programme (PDF)', lang === 'en'), '.', otherVersion(lang));
  }

  var rules = {
    nom: function (v) { return v ? '' : 'Indiquez votre nom.'; },
    email: function (v) {
      if (!v) return 'Indiquez votre adresse e-mail.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Cette adresse e-mail semble incomplète.';
    },
    message: function (v) { return v ? '' : 'Écrivez-nous quelques mots.'; }
  };

  function check(field) {
    var error = rules[field.name](field.value.trim());
    var output = document.getElementById(field.name + '-erreur');
    field.setAttribute('aria-invalid', error ? 'true' : 'false');
    if (output) output.textContent = error;
    return !error;
  }

  form.addEventListener('input', function (event) {
    var field = event.target;
    if (rules[field.name] && field.getAttribute('aria-invalid') === 'true') check(field);
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (form.getAttribute('aria-busy') === 'true') return;
    status.textContent = '';
    status.className = 'form-status';

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var field = form.elements[name];
      if (!check(field) && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    var data = {
      nom: form.elements.nom.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim(),
      langue: form.elements.langue.value === 'en' ? 'en' : 'fr'
    };

    if (!EMAILJS_READY) {
      success(data.email, data.langue);
      return;
    }

    form.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    submit.textContent = 'Envoi en cours…';

    sendWithEmailJS(data)
      .then(function () { success(data.email, data.langue); })
      .catch(function () { failure(data.langue); })
      .then(function () {
        form.removeAttribute('aria-busy');
        submit.disabled = false;
        submit.textContent = submitLabel;
      });
  });
}

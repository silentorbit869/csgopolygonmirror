/* UI: mobile nav, copy buttons, TOC, cookie consent, sticky CTA, forms */
(function () {
  'use strict';

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ------------------------------------------------------------ mobile nav */

  function initNav() {
    var toggle = $('.nav-toggle');
    var nav = $('#site-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ TOC */

  function initToc() {
    var toc = $('#toc');
    if (!toc) return;

    var links = $$('a[href^="#"]', toc);
    if (!links.length) return;

    var targets = links
      .map(function (link) {
        var id = link.getAttribute('href').slice(1);
        var el = document.getElementById(id);
        return el ? { link: link, el: el } : null;
      })
      .filter(Boolean);

    if (!targets.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var match = targets.filter(function (t) {
            return t.el === entry.target;
          })[0];
          if (!match) return;
          links.forEach(function (l) {
            l.classList.remove('is-active');
          });
          match.link.classList.add('is-active');
        });
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    );

    targets.forEach(function (t) {
      observer.observe(t.el);
    });
  }

  /* ------------------------------------------------------------ sticky CTA */

  function initStickyCta() {
    var bar = $('.sticky-cta');
    if (!bar) return;

    var trigger = $('.hero') || $('main');
    if (!trigger) return;

    if (!('IntersectionObserver' in window)) {
      bar.classList.add('is-visible');
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          bar.classList.toggle('is-visible', !entry.isIntersecting);
        });
      },
      { threshold: 0 }
    );

    observer.observe(trigger);
  }

  /* -------------------------------------------------------- cookie consent */

  var CONSENT_KEY = 'cpm_consent_v1';

  function readConsent() {
    try {
      var raw = window.localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable */
    }
  }

  /* Analytics slot: only ever runs when the visitor has opted in.
     No analytics vendor is loaded on this site today. */
  function applyConsent(consent) {
    if (!consent || consent.analytics !== true) return;
    /* intentionally empty */
  }

  function initCookie() {
    var banner = $('#cookie-banner');
    if (!banner) return;

    var settings = $('#cookie-settings', banner);
    var analyticsInput = $('#cookie-analytics', banner);
    var existing = readConsent();

    function close() {
      banner.classList.remove('is-open');
    }

    function open() {
      banner.classList.add('is-open');
    }

    if (!existing) {
      open();
    } else {
      applyConsent(existing);
    }

    var acceptBtn = $('[data-cookie="accept"]', banner);
    var rejectBtn = $('[data-cookie="reject"]', banner);
    var settingsBtn = $('[data-cookie="settings"]', banner);
    var saveBtn = $('[data-cookie="save"]', banner);

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        var consent = { necessary: true, analytics: true, ts: Date.now() };
        writeConsent(consent);
        applyConsent(consent);
        close();
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', function () {
        writeConsent({ necessary: true, analytics: false, ts: Date.now() });
        close();
      });
    }

    if (settingsBtn && settings) {
      settingsBtn.addEventListener('click', function () {
        var isOpen = settings.classList.toggle('is-open');
        settingsBtn.setAttribute('aria-expanded', String(isOpen));
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var consent = {
          necessary: true,
          analytics: !!(analyticsInput && analyticsInput.checked),
          ts: Date.now()
        };
        writeConsent(consent);
        applyConsent(consent);
        close();
      });
    }

    $$('[data-cookie-open]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var current = readConsent();
        if (analyticsInput && current) analyticsInput.checked = current.analytics === true;
        if (settings) {
          settings.classList.add('is-open');
          if (settingsBtn) settingsBtn.setAttribute('aria-expanded', 'true');
        }
        open();
      });
    });
  }

  /* ---------------------------------------------------------------- forms */

  function initForms() {
    $$('form[data-mailto]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var valid = true;
        $$('[required]', form).forEach(function (input) {
          var field = input.closest('.field');
          var ok = input.value.trim() !== '' && input.checkValidity();
          if (field) field.classList.toggle('is-invalid', !ok);
          if (!ok && valid) {
            input.focus();
            valid = false;
          }
        });

        if (!valid) return;

        var to = form.getAttribute('data-mailto');
        var subjectField = form.querySelector('[data-subject]');
        var subject = subjectField ? subjectField.value : form.getAttribute('data-subject-default') || '';
        if (!subject) subject = form.getAttribute('data-subject-default') || 'Message';

        var lines = [];
        $$('input, select, textarea', form).forEach(function (input) {
          if (!input.name || input.type === 'submit') return;
          var label = form.querySelector('label[for="' + input.id + '"]');
          var name = label ? label.textContent.replace('*', '').trim() : input.name;
          lines.push(name + ': ' + input.value);
        });

        var body = lines.join('\r\n');
        window.location.href =
          'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      });

      $$('[required]', form).forEach(function (input) {
        input.addEventListener('blur', function () {
          var field = input.closest('.field');
          if (field && input.value.trim() !== '') field.classList.remove('is-invalid');
        });
      });
    });
  }

  /* ----------------------------------------------------------------- init */

  function init() {
    initNav();
    initToc();
    initStickyCta();
    initCookie();
    initForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

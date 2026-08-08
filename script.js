/* ==========================================================
   R BAVADHARANI -- PORTFOLIO
   Scroll reveal, nav highlighting, hero video fallback
   (3D background lives separately in hero-globe.js)
   ========================================================== */

/* ---------- SCROLL REVEAL ----------
   Wrapped defensively: reveal must never depend on any
   other script (Three.js, hero-globe.js) succeeding. */
try {
  var reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    /* no IntersectionObserver support: just show everything */
    reveals.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* failsafe: force-reveal anything still hidden after 4s,
     in case an observer never fires for any reason */
  setTimeout(function () {
    document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
      el.classList.add('visible');
    });
  }, 4000);
} catch (err) {
  /* absolute last resort: show every section immediately */
  document.querySelectorAll('.reveal').forEach(function (el) {
    el.classList.add('visible');
  });
  console.error('Scroll reveal failed, showing all sections:', err);
}

/* ---------- NAVBAR ACTIVE LINK + SCROLL DARKEN ---------- */
var sections = document.querySelectorAll('[id]');
var navLinks = document.querySelectorAll('.nav-links a');
var navbar = document.getElementById('navbar');

window.addEventListener('scroll', function () {
  var cur = '';
  sections.forEach(function (s) {
    if (window.scrollY >= s.offsetTop - 140) cur = s.id;
  });
  navLinks.forEach(function (a) {
    a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
  });
  if (navbar) {
    navbar.style.background =
      window.scrollY > 40 ? 'rgba(5,8,20,0.95)' : 'rgba(5,8,20,0.78)';
  }
});

/* ---------- HERO VIDEO FALLBACK ----------
   If assets/hero-bg.mp4 hasn't been added yet, hide the
   video layer cleanly instead of showing a broken element. */
var heroVideo = document.querySelector('#hero-video video');
if (heroVideo) {
  heroVideo.addEventListener('error', function () {
    var wrap = document.getElementById('hero-video');
    if (wrap) wrap.style.display = 'none';
  });
}

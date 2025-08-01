// Arquivo JavaScript principal
// animações simples respeitando prefers-reduced-motion
(function() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('animate');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.services__card, .hero, .form').forEach(el => observer.observe(el));
  }

  const header = document.querySelector('.site-header');
  function onScroll() {
    if (window.scrollY > 50) {
      header.classList.add('site-header--scrolled');
    } else {
      header.classList.remove('site-header--scrolled');
    }
  }
  window.addEventListener('scroll', onScroll);
})();

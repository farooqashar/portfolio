(function() {
  "use strict";

  const select = (el, all = false) => {
    el = el.trim();
    if (all) {
      return [...document.querySelectorAll(el)];
    } else {
      return document.querySelector(el);
    }
  };

  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all);
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener));
      } else {
        selectEl.addEventListener(type, listener);
      }
    }
  };

  const onscroll = (el, listener) => {
    el.addEventListener("scroll", listener);
  };

  let navbarlinks = select("#navbar .scrollto", true);
  const navbarlinksActive = () => {
    let position = window.scrollY + 200;
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return;
      let section = select(navbarlink.hash);
      if (!section) return;
      if (
        position >= section.offsetTop &&
        position <= section.offsetTop + section.offsetHeight
      ) {
        navbarlink.classList.add("active");
      } else {
        navbarlink.classList.remove("active");
      }
    });
  };
  window.addEventListener("load", navbarlinksActive);
  onscroll(document, navbarlinksActive);

  const scrollto = el => {
    let elementPos = select(el).offsetTop;
    window.scrollTo({
      top: elementPos,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth"
    });
  };

  /**
   * Back to top button
   */
  let backtotop = select(".back-to-top");
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add("active");
      } else {
        backtotop.classList.remove("active");
      }
    };
    window.addEventListener("load", toggleBacktotop);
    onscroll(document, toggleBacktotop);
  }

  /**
   * Mobile nav toggle
   */
  const setMobileNav = (open) => {
    select("body").classList.toggle("mobile-nav-active", open);
    let navbarToggle = select(".mobile-nav-toggle");
    let icon = navbarToggle.querySelector("i");
    icon.classList.toggle("bi-list", !open);
    icon.classList.toggle("bi-x", open);
    navbarToggle.setAttribute("aria-expanded", open);
    navbarToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  on("click", ".mobile-nav-toggle", function(e) {
    setMobileNav(!select("body").classList.contains("mobile-nav-active"));
  });

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on(
    "click",
    ".scrollto",
    function(e) {
      if (select(this.hash)) {
        let body = select("body");
        if (body.classList.contains("mobile-nav-active")) {
          setMobileNav(false);
        }
      }
    },
    true
  );

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener("load", () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash);
      }
    }
  });

  /**
   * Hero type effect
   */
  const typed = select(".typed");
  if (typed) {
    let typed_strings = typed.getAttribute("data-typed-items");
    typed_strings = typed_strings.split(",");
    new Typed(".typed", {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /**
   * Porfolio isotope and filter
   */
  window.addEventListener("load", () => {
    let portfolioContainer = select(".portfolio-container");
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: ".portfolio-item"
      });

      let portfolioFilters = select("#portfolio-flters li", true);

      on(
        "click",
        "#portfolio-flters li",
        function(e) {
          e.preventDefault();
          portfolioFilters.forEach(function(el) {
            el.classList.remove("filter-active");
          });
          this.classList.add("filter-active");

          portfolioIsotope.arrange({
            filter: this.getAttribute("data-filter")
          });
          portfolioIsotope.on("arrangeComplete", function() {
            AOS.refresh();
          });
        },
        true
      );
    }
  });

  /**
   * Initiate portfolio lightbox
   */
  const portfolioLightbox = GLightbox({
    selector: ".portfolio-lightbox"
  });

  /**
   * Portfolio details slider
   */
  new Swiper(".portfolio-details-slider", {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: ".swiper-pagination",
      type: "bullets",
      clickable: true
    }
  });

  /**
   * Testimonials slider
   */
  new Swiper(".testimonials-slider", {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: "auto",
    pagination: {
      el: ".swiper-pagination",
      type: "bullets",
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 20
      },

      1200: {
        slidesPerView: 3,
        spaceBetween: 20
      }
    }
  });

  /**
   * About facts: age from the birthday, travel counts from the travel site's data.
   * The numbers in index.html stay as the fallback.
   */
  const ageEl = select("#age");
  if (ageEl) {
    const today = new Date();
    // Birthday: September 27, 2000 (months are 0-based)
    let age = today.getFullYear() - 2000;
    if (today.getMonth() < 8 || (today.getMonth() === 8 && today.getDate() < 27)) {
      age--;
    }
    ageEl.textContent = age;
  }

  const countriesEl = select("#countries-traveled");
  const statesEl = select("#us-states-visited");
  if (countriesEl || statesEl) {
    fetch("https://raw.githubusercontent.com/farooqashar/ashar-mcp/main/data/travel.json")
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => {
        const countries = d.stats && d.stats.totalCountries;
        const states = (d.challenges || []).find(c => c.id === "us-states");
        if (countriesEl && Number.isInteger(countries)) {
          countriesEl.textContent = countries;
        }
        if (statesEl && states && Number.isInteger(states.progress)) {
          statesEl.textContent = states.progress;
        }
      })
      .catch(() => {});
  }

  /**
   * Life Happenings: collapse long chapters behind a "Show all" button
   */
  document.querySelectorAll(".chapter-toggle").forEach((btn) => {
    const list = document.getElementById(btn.getAttribute("aria-controls"));
    if (!list) return;
    const total = list.children.length;
    list.classList.add("is-collapsed");
    btn.hidden = false;
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      list.classList.toggle("is-collapsed", expanded);
      btn.textContent = expanded ? `Show all ${total}` : "Show fewer";
      if (expanded) btn.closest(".chapter").scrollIntoView({ block: "nearest" });
    });
  });

  /**
   * Animation on scroll
   */
  window.addEventListener("load", () => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
      mirror: false
    });
  });
})();

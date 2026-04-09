document.addEventListener("DOMContentLoaded", function () {
  const config = window.RUNBOOK_RELAY_CONFIG || {};
  const year = document.getElementById("footer-year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  if (config.calendlyUrl) {
    document.querySelectorAll("[data-calendly-link]").forEach(function (link) {
      link.href = config.calendlyUrl;
    });
  }
});

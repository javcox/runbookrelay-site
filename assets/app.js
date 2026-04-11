document.addEventListener("DOMContentLoaded", function () {
  const config = window.RUNBOOK_RELAY_CONFIG || {};
  const siteUrl = config.siteUrl || window.location.origin;
  const storageKey = config.leadStorageKey || "rr_audit_lead";
  const thankYouPath = config.thankYouPath || "/thank-you/";
  const year = document.getElementById("footer-year");
  const header = document.querySelector("[data-site-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navMenu = document.querySelector("[data-nav-menu]");
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const forms = Array.from(document.querySelectorAll("[data-audit-form]"));

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  document.querySelectorAll("[data-route]").forEach(function (link) {
    const route = (link.getAttribute("data-route") || "").replace(/\/+$/, "") || "/";
    const isCurrent = route === path;
    link.classList.toggle("is-current", isCurrent);
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    }
  });

  function closeNav() {
    if (!header || !navToggle) return;
    header.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle && header) {
    navToggle.addEventListener("click", function () {
      const nextExpanded = navToggle.getAttribute("aria-expanded") !== "true";
      navToggle.setAttribute("aria-expanded", String(nextExpanded));
      header.classList.toggle("nav-open", nextExpanded);
    });
  }

  if (navMenu) {
    navMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeNav();
      });
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeNav();
    }
  });

  function track(name, props) {
    if (window.RunbookRelayAnalytics && typeof window.RunbookRelayAnalytics.trackEvent === "function") {
      window.RunbookRelayAnalytics.trackEvent(name, props);
    }
  }

  function getUtmData() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || ""
    };
  }

  function persistLead(lead) {
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(lead));
    } catch (_error) {}
  }

  function readLead() {
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function setStatus(form, message, state) {
    const target = form.querySelector("[data-form-status]");
    if (!target) return;
    target.textContent = message || "";
    target.dataset.state = state || "";
  }

  function setChoiceValue(group, value) {
    const input = group.querySelector("[data-choice-input]");
    if (!input) return;

    input.value = value;
    group.classList.remove("is-invalid");

    group.querySelectorAll("[data-choice-value]").forEach(function (button) {
      const isSelected = button.getAttribute("data-choice-value") === value;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function initializeChoiceGroups(form) {
    form.querySelectorAll("[data-choice-group]").forEach(function (group) {
      const input = group.querySelector("[data-choice-input]");
      const choiceName = group.getAttribute("data-choice-name");
      const defaultValue =
        choiceName === "industry" ? form.getAttribute("data-default-industry") || "" : "";

      group.querySelectorAll("[data-choice-value]").forEach(function (button) {
        button.addEventListener("click", function () {
          setChoiceValue(group, button.getAttribute("data-choice-value") || "");
        });
      });

      const initialValue = input && input.value ? input.value : defaultValue;
      if (initialValue) {
        setChoiceValue(group, initialValue);
      }
    });
  }

  function validateChoiceGroups(form) {
    let isValid = true;

    form.querySelectorAll("[data-choice-group]").forEach(function (group) {
      const input = group.querySelector("[data-choice-input]");
      if (!input || !input.required) return;

      const hasValue = Boolean(String(input.value || "").trim());
      group.classList.toggle("is-invalid", !hasValue);

      if (!hasValue) {
        isValid = false;
      }
    });

    return isValid;
  }

  function syncHiddenFields(form) {
    const utmData = getUtmData();
    const defaults = {
      source_page: form.getAttribute("data-page-label") || path,
      source_path: path,
      source_url: window.location.href,
      submitted_at: new Date().toISOString(),
      utm_source: utmData.utm_source,
      utm_medium: utmData.utm_medium,
      utm_campaign: utmData.utm_campaign
    };

    Object.keys(defaults).forEach(function (key) {
      const input = form.querySelector('input[name="' + key + '"]');
      if (input) {
        input.value = defaults[key];
      }
    });
  }

  function buildLeadPayload(form) {
    const formData = new FormData(form);
    const payload = {};

    formData.forEach(function (value, key) {
      payload[key] = String(value || "").trim();
    });

    payload.page_title = document.title;
    payload.referrer = document.referrer || "";
    payload.scheduler_url = config.calendlyUrl || "";
    return payload;
  }

  function getThankYouUrl(lead) {
    const url = new URL(thankYouPath, siteUrl.endsWith("/") ? siteUrl : siteUrl + "/");
    if (lead.industry) {
      url.searchParams.set("industry", lead.industry);
    }
    if (lead.source_page) {
      url.searchParams.set("source", lead.source_page);
    }
    return url.toString();
  }

  async function postLeadToWebhook(lead) {
    if (!config.leadCaptureWebhook) {
      return false;
    }

    try {
      await fetch(config.leadCaptureWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(lead),
        keepalive: true
      });
      return true;
    } catch (_error) {
      return false;
    }
  }

  forms.forEach(function (form) {
    initializeChoiceGroups(form);
    syncHiddenFields(form);

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      syncHiddenFields(form);

      const nativeValid = form.reportValidity();
      const choiceValid = validateChoiceGroups(form);

      if (!nativeValid || !choiceValid) {
        setStatus(form, "Please complete the required fields so the audit can be routed correctly.", "error");
        track("rr_audit_form_invalid", {
          source_page: form.getAttribute("data-page-label") || path
        });
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
      }

      setStatus(form, "Saving your audit details and opening the scheduler...", "working");

      const lead = buildLeadPayload(form);
      persistLead(lead);
      track("rr_audit_form_submit", {
        source_page: lead.source_page,
        industry: lead.industry,
        biggest_issue: lead.biggest_issue
      });

      await postLeadToWebhook(lead);
      window.location.href = getThankYouUrl(lead);
    });
  });

  function buildCalendlyUrl(lead) {
    if (!config.calendlyUrl) {
      return "";
    }

    const url = new URL(config.calendlyUrl);
    url.searchParams.set("hide_gdpr_banner", "1");
    url.searchParams.set("hide_landing_page_details", "1");

    if (lead) {
      if (lead.first_name) {
        url.searchParams.set("name", lead.first_name);
      }
      if (lead.email) {
        url.searchParams.set("email", lead.email);
      }
    }

    return url.toString();
  }

  function fillText(selector, value) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.textContent = value;
    });
  }

  function hydrateThankYou() {
    if (path !== "/thank-you") {
      return;
    }

    const lead = readLead();
    const schedulerUrl = buildCalendlyUrl(lead);

    if (lead) {
      fillText("[data-lead-name]", lead.first_name || "there");
      fillText("[data-lead-industry]", (lead.industry || "service business").replace(/_/g, " "));
      fillText("[data-lead-issue]", (lead.biggest_issue || "response leakage").replace(/_/g, " "));
      fillText("[data-lead-business]", lead.business_name || "your business");
      fillText("[data-lead-website]", lead.website || "your current site");
      track("rr_thank_you_view", {
        source_page: lead.source_page || "",
        industry: lead.industry || "",
        biggest_issue: lead.biggest_issue || ""
      });
    } else {
      fillText("[data-lead-name]", "there");
      fillText("[data-lead-industry]", "service business");
      fillText("[data-lead-issue]", "response leakage");
      fillText("[data-lead-business]", "your business");
      fillText("[data-lead-website]", "your current site");
      track("rr_thank_you_view", {
        source_page: "direct",
        industry: "",
        biggest_issue: ""
      });
    }

    document.querySelectorAll("[data-direct-calendly-link]").forEach(function (link) {
      link.href = schedulerUrl || config.calendlyUrl || "#";
    });

    document.querySelectorAll("[data-calendly-frame]").forEach(function (frame) {
      if (!schedulerUrl) return;
      frame.src = schedulerUrl;
      frame.title = "Runbook Relay 20-minute audit scheduler";
      track("rr_scheduler_embed_loaded", {
        source_page: lead && lead.source_page ? lead.source_page : "direct"
      });
    });
  }

  hydrateThankYou();

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    document.querySelectorAll("[data-reveal]").forEach(function (node) {
      observer.observe(node);
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (node) {
      node.classList.add("is-visible");
    });
  }
});

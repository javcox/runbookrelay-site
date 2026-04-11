document.addEventListener("DOMContentLoaded", function () {
  const config = window.RUNBOOK_RELAY_CONFIG || {};
  const siteUrl = config.siteUrl || window.location.origin;
  const storageKey = config.leadStorageKey || "rr_audit_lead";
  const thankYouPath = config.thankYouPath || "/thank-you/";
  const smsConsentTextVersion = "2026-04-11-v1";
  const smsConsentText =
    "I agree to receive text messages from Runbook Relay about my inquiry, scheduling, appointment reminders, and follow-up. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.";
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

  function syncHeaderState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  }

  function initializeGlobalBackground() {
    if (document.querySelector("[data-site-background]")) {
      return;
    }

    const canvasHost = document.createElement("div");
    const canvas = document.createElement("canvas");
    const overlay = document.createElement("div");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const body = document.body;

    canvasHost.className = "site-background";
    canvasHost.setAttribute("data-site-background", "");
    canvasHost.setAttribute("aria-hidden", "true");

    canvas.className = "site-background-canvas";
    overlay.className = "site-background-overlay";

    canvasHost.appendChild(canvas);
    canvasHost.appendChild(overlay);
    body.prepend(canvasHost);
    body.classList.add("has-global-background");

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lanes = [];
    let nodes = [];
    let frictionZones = [];
    let stageMarkers = [];
    let lastRender = 0;

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function buildScene() {
      const laneCount = width <= 640 ? 4 : 6;
      const nodeCount = width <= 640 ? 7 : 12;
      const laneGap = height / (laneCount + 1);

      lanes = Array.from({ length: laneCount }, function (_, index) {
        const priority = index % 2 === 0 ? "primary" : "secondary";
        return {
          baseY: laneGap * (index + 1),
          phase: randomBetween(-Math.PI, Math.PI),
          amplitude: priority === "primary" ? randomBetween(8, 18) : randomBetween(6, 13),
          drift: randomBetween(0.00012, 0.00024),
          depth: randomBetween(0.72, 1.18),
          priority: priority
        };
      });

      frictionZones = [
        { x: width * 0.24, width: width * 0.12, intensity: 0.16 },
        { x: width * 0.54, width: width * 0.1, intensity: 0.2 },
        { x: width * 0.78, width: width * 0.08, intensity: 0.11 }
      ];

      stageMarkers = [0.16, 0.34, 0.54, 0.74, 0.9].map(function (position) {
        return {
          x: position * width
        };
      });

      nodes = Array.from({ length: nodeCount }, function (_, index) {
        return {
          id: index,
          laneIndex: Math.floor(Math.random() * lanes.length),
          progress: Math.random(),
          baseSpeed: randomBetween(0.00018, 0.00034),
          speed: 0,
          size: randomBetween(1.8, 3.1),
          alpha: randomBetween(0.32, 0.68)
        };
      });
    }

    function laneYAtProgress(lane, progress, time) {
      const oscillation =
        lane.amplitude * Math.sin(progress * Math.PI * 3.2 + lane.phase + time * lane.drift);
      const funnelBias = (height * 0.54 - lane.baseY) * Math.pow(progress, 2.15) * 0.085;
      const correctionBias = Math.sin((progress * 2.5 + lane.phase) * Math.PI) * lane.depth * 3.4;
      return lane.baseY + oscillation + funnelBias + correctionBias;
    }

    function drawFrictionZones() {
      frictionZones.forEach(function (zone, index) {
        const zoneGradient = ctx.createLinearGradient(zone.x, 0, zone.x + zone.width, 0);
        zoneGradient.addColorStop(0, "rgba(4, 10, 18, 0)");
        zoneGradient.addColorStop(0.5, index === 1 ? "rgba(8, 18, 29, 0.24)" : "rgba(8, 18, 29, 0.18)");
        zoneGradient.addColorStop(1, "rgba(4, 10, 18, 0)");
        ctx.fillStyle = zoneGradient;
        ctx.fillRect(zone.x, 0, zone.width, height);
      });
    }

    function drawStageMarkers() {
      stageMarkers.forEach(function (marker, index) {
        ctx.beginPath();
        ctx.strokeStyle = index === stageMarkers.length - 1 ? "rgba(102, 199, 225, 0.08)" : "rgba(111, 164, 207, 0.05)";
        ctx.lineWidth = index % 2 === 0 ? 1 : 0.8;
        ctx.moveTo(marker.x, 0);
        ctx.lineTo(marker.x, height);
        ctx.stroke();
      });
    }

    function drawLanes(time) {
      const xStep = Math.max(18, width / 56);
      lanes.forEach(function (lane) {
        const isPrimary = lane.priority === "primary";
        ctx.beginPath();
        ctx.strokeStyle = isPrimary ? "rgba(105, 187, 242, 0.12)" : "rgba(88, 154, 198, 0.06)";
        ctx.lineWidth = isPrimary ? 1.25 : 0.8;
        for (let x = -width * 0.06; x <= width * 1.04; x += xStep) {
          const progress = x / width;
          const drawY = laneYAtProgress(lane, progress, time);
          if (x <= -width * 0.06) {
            ctx.moveTo(x, drawY);
          } else {
            ctx.lineTo(x, drawY);
          }
        }
        ctx.stroke();
      });
    }

    function drawNode(node, x, y, isPrimary) {
      const glowSize = isPrimary ? node.size * 5.2 : node.size * 3.2;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      const glowAlpha = (isPrimary ? 0.24 : 0.12) * node.alpha;
      const coreAlpha = (isPrimary ? 0.74 : 0.4) * node.alpha;

      glow.addColorStop(0, "rgba(121, 222, 210, " + glowAlpha.toFixed(3) + ")");
      glow.addColorStop(0.55, "rgba(93, 170, 232, " + (glowAlpha * 0.52).toFixed(3) + ")");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(160, 239, 228, " + coreAlpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(x, y, node.size, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawNodes(time, staticOnly) {
      nodes.forEach(function (node) {
        const lane = lanes[node.laneIndex];
        const isPrimary = lane.priority === "primary";
        const x = node.progress * width;
        const y = laneYAtProgress(lane, node.progress, time);

        if (!staticOnly) {
          let speedModifier = 1;

          frictionZones.forEach(function (zone) {
            if (x > zone.x && x < zone.x + zone.width) {
              speedModifier -= zone.intensity;
            }
          });

          if (node.progress > 0.72) {
            speedModifier += 0.14;
          }

          if (node.progress > 0.9) {
            speedModifier += 0.05;
          }

          node.speed = node.baseSpeed * Math.max(0.5, speedModifier);
          node.progress += node.speed;

          if (node.progress > 1.04) {
            node.progress = randomBetween(-0.08, 0.02);
            node.laneIndex = Math.floor(Math.random() * lanes.length);
          }
        }

        drawNode(node, x, y, isPrimary);
      });
    }

    function paintFrame(time, staticOnly) {
      ctx.clearRect(0, 0, width, height);

      const wash = ctx.createLinearGradient(0, 0, 0, height);
      wash.addColorStop(0, "rgba(5, 10, 18, 0.08)");
      wash.addColorStop(0.48, "rgba(7, 14, 22, 0.18)");
      wash.addColorStop(1, "rgba(2, 5, 10, 0.36)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);

      drawFrictionZones();
      drawStageMarkers();
      drawLanes(time);
      drawNodes(time, staticOnly);

      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.38,
        width * 0.08,
        width * 0.5,
        height * 0.5,
        width * 0.84
      );
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(0.72, "rgba(0, 0, 0, 0.2)");
      vignette.addColorStop(1, "rgba(2, 5, 10, 0.62)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    }

    function renderFrame(time) {
      if (time - lastRender < 33) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
        return;
      }

      lastRender = time;
      paintFrame(time, false);
      animationFrameId = window.requestAnimationFrame(renderFrame);
    }

    function updateCanvasSize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, width <= 640 ? 1 : 1.35);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildScene();
      paintFrame(window.performance.now(), true);
    }

    function stopAnimation() {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    }

    function syncAnimationState() {
      stopAnimation();

      if (reducedMotionQuery.matches || document.visibilityState === "hidden") {
        paintFrame(window.performance.now(), true);
        return;
      }

      animationFrameId = window.requestAnimationFrame(renderFrame);
    }

    updateCanvasSize();
    syncAnimationState();

    window.addEventListener("resize", updateCanvasSize, { passive: true });
    document.addEventListener("visibilitychange", syncAnimationState);

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", syncAnimationState);
    } else if (typeof reducedMotionQuery.addListener === "function") {
      reducedMotionQuery.addListener(syncAnimationState);
    }
  }

  syncHeaderState();
  initializeGlobalBackground();
  window.addEventListener("scroll", syncHeaderState, { passive: true });

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

  function normalizePhoneNumber(rawValue) {
    const raw = String(rawValue || "").trim();
    if (!raw) {
      return { valid: false, value: "" };
    }

    if (raw.startsWith("+")) {
      const digits = raw.slice(1).replace(/\D/g, "");
      const normalized = "+" + digits;
      return {
        valid: /^\+\d{8,15}$/.test(normalized),
        value: normalized
      };
    }

    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) {
      return { valid: true, value: "+1" + digits };
    }

    if (digits.length === 11 && digits.startsWith("1")) {
      return { valid: true, value: "+" + digits };
    }

    return { valid: false, value: raw };
  }

  function preparePhoneField(form) {
    const phoneInput = form.querySelector('input[name="phone"]');
    if (!phoneInput) return true;

    phoneInput.setCustomValidity("");

    if (!String(phoneInput.value || "").trim()) {
      return true;
    }

    const normalized = normalizePhoneNumber(phoneInput.value);
    if (!normalized.valid) {
      phoneInput.setCustomValidity(
        "Enter a valid phone number. U.S./Canada numbers can be entered normally. For other countries, include the country code."
      );
      return false;
    }

    phoneInput.value = normalized.value;
    return true;
  }

  function normalizeWebsiteValue(rawValue) {
    const raw = String(rawValue || "").trim();
    if (!raw) {
      return { valid: false, value: "" };
    }

    const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) ? raw : "https://" + raw.replace(/^\/+/, "");

    try {
      const url = new URL(candidate);
      if (!/^https?:$/.test(url.protocol) || !url.hostname || !url.hostname.includes(".")) {
        return { valid: false, value: candidate };
      }

      const normalizedPath =
        url.pathname === "/" && !url.search && !url.hash
          ? ""
          : url.pathname + url.search + url.hash;

      return {
        valid: true,
        value: url.protocol + "//" + url.host + normalizedPath
      };
    } catch (_error) {
      return { valid: false, value: candidate };
    }
  }

  function prepareWebsiteField(form) {
    const websiteInput = form.querySelector('input[name="website"]');
    if (!websiteInput) return true;

    websiteInput.setCustomValidity("");

    if (!String(websiteInput.value || "").trim()) {
      return true;
    }

    const normalized = normalizeWebsiteValue(websiteInput.value);
    if (!normalized.valid) {
      websiteInput.setCustomValidity("Enter a valid website URL.");
      return false;
    }

    websiteInput.value = normalized.value;
    return true;
  }

  function parseChoiceValues(rawValue) {
    return String(rawValue || "")
      .split(",")
      .map(function (value) {
        return value.trim();
      })
      .filter(Boolean);
  }

  function updateChoiceStatus(group, selectedValues) {
    const note = group.querySelector("[data-choice-status]");
    if (!note) return;

    const max = Number(group.getAttribute("data-choice-max") || "1");
    if (max > 1) {
      note.textContent =
        selectedValues.length > 0
          ? selectedValues.length + " of " + max + " selected"
          : "Pick up to " + max + ".";
      return;
    }

    note.textContent = "";
  }

  function setChoiceValue(group, value) {
    const input = group.querySelector("[data-choice-input]");
    if (!input) return;

    const max = Number(group.getAttribute("data-choice-max") || "1");
    let selectedValues = parseChoiceValues(input.value);

    if (max > 1) {
      const isSelected = selectedValues.includes(value);

      if (isSelected) {
        selectedValues = selectedValues.filter(function (entry) {
          return entry !== value;
        });
      } else if (selectedValues.length < max) {
        selectedValues = selectedValues.concat(value);
      }
    } else {
      selectedValues = value ? [value] : [];
    }

    input.value = selectedValues.join(",");
    group.classList.remove("is-invalid");
    group.classList.toggle("is-maxed", max > 1 && selectedValues.length >= max);
    updateChoiceStatus(group, selectedValues);

    group.querySelectorAll("[data-choice-value]").forEach(function (button) {
      const isSelected = selectedValues.includes(button.getAttribute("data-choice-value") || "");
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
      if (input) {
        input.value = initialValue;
      }

      if (initialValue) {
        updateChoiceStatus(group, parseChoiceValues(initialValue));
        group.querySelectorAll("[data-choice-value]").forEach(function (button) {
          const isSelected = parseChoiceValues(initialValue).includes(button.getAttribute("data-choice-value") || "");
          button.classList.toggle("is-selected", isSelected);
          button.setAttribute("aria-pressed", String(isSelected));
        });
        group.classList.toggle(
          "is-maxed",
          Number(group.getAttribute("data-choice-max") || "1") > 1 &&
            parseChoiceValues(initialValue).length >= Number(group.getAttribute("data-choice-max") || "1")
        );
      } else {
        updateChoiceStatus(group, []);
      }
    });
  }

  function validateChoiceGroups(form) {
    let isValid = true;

    form.querySelectorAll("[data-choice-group]").forEach(function (group) {
      const input = group.querySelector("[data-choice-input]");
      if (!input || !input.required) return;

      const hasValue = parseChoiceValues(input.value).length > 0;
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
    payload.sms_consent = formData.get("sms_consent") ? "true" : "false";
    payload.sms_consent_given_at = payload.sms_consent === "true" ? new Date().toISOString() : "";
    payload.sms_consent_text_version = smsConsentTextVersion;
    payload.sms_consent_text = smsConsentText;
    payload.sms_consent_page_url = window.location.href;
    payload.user_agent = window.navigator.userAgent || "";
    return payload;
  }

  function formatChoiceValue(rawValue) {
    const values = parseChoiceValues(rawValue).map(function (value) {
      return value.replace(/_/g, " ");
    });

    return values.length > 0 ? values.join(", ") : "";
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

    const urlEncoded = new URLSearchParams();
    Object.keys(lead).forEach(function (key) {
      urlEncoded.append(key, lead[key] == null ? "" : String(lead[key]));
    });

    try {
      if (window.navigator && typeof window.navigator.sendBeacon === "function") {
        const queued = window.navigator.sendBeacon(config.leadCaptureWebhook, urlEncoded);
        if (queued) {
          return true;
        }
      }

      await fetch(config.leadCaptureWebhook, {
        method: "POST",
        mode: "no-cors",
        body: urlEncoded,
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

    const phoneInput = form.querySelector('input[name="phone"]');
    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        phoneInput.setCustomValidity("");
      });

      phoneInput.addEventListener("blur", function () {
        if (!String(phoneInput.value || "").trim()) {
          phoneInput.setCustomValidity("");
          return;
        }

        const normalized = normalizePhoneNumber(phoneInput.value);
        if (normalized.valid) {
          phoneInput.value = normalized.value;
          phoneInput.setCustomValidity("");
        }
      });
    }

    const websiteInput = form.querySelector('input[name="website"]');
    if (websiteInput) {
      websiteInput.addEventListener("input", function () {
        websiteInput.setCustomValidity("");
      });

      websiteInput.addEventListener("blur", function () {
        if (!String(websiteInput.value || "").trim()) {
          websiteInput.setCustomValidity("");
          return;
        }

        const normalized = normalizeWebsiteValue(websiteInput.value);
        if (normalized.valid) {
          websiteInput.value = normalized.value;
          websiteInput.setCustomValidity("");
        }
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      syncHiddenFields(form);

      preparePhoneField(form);
      prepareWebsiteField(form);
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
        biggest_issue: lead.biggest_issue,
        biggest_issue_count: parseChoiceValues(lead.biggest_issue).length
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
      fillText("[data-lead-industry]", formatChoiceValue(lead.industry) || "service business");
      fillText("[data-lead-issue]", formatChoiceValue(lead.biggest_issue) || "response leakage");
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

  function initializeMotionRhythm() {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches) {
      return;
    }

    const staggerGroups = [
      ".systems-rail",
      ".systems-footer",
      ".proof-grid",
      ".route-home .proof-grid-home",
      ".route-grid",
      ".deliverables-grid",
      ".outcomes-grid",
      ".credibility-grid",
      ".industry-grid",
      ".service-grid",
      ".comparison-grid",
      ".process-grid",
      ".about-founder-pillars",
      ".about-proof-stack",
      ".about-fit-strip",
      ".about-process-flow",
      ".decision-points",
      ".home-step-list",
      ".home-result-strip",
      ".home-founder-points",
      ".faq-list"
    ];

    staggerGroups.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (group) {
        Array.from(group.children).forEach(function (child, index) {
          if (!child.hasAttribute("data-reveal")) {
            child.setAttribute("data-reveal", "");
          }

          if (!child.style.getPropertyValue("--reveal-delay")) {
            child.style.setProperty("--reveal-delay", Math.min(index, 5) * 65 + "ms");
          }
        });
      });
    });
  }

  initializeMotionRhythm();

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

    const revealInViewport = function () {
      document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach(function (node) {
        const rect = node.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.94 && rect.bottom >= 0) {
          node.classList.add("is-visible");
          observer.unobserve(node);
        }
      });
    };

    document.querySelectorAll("[data-reveal]").forEach(function (node) {
      observer.observe(node);
    });

    revealInViewport();

    window.addEventListener("load", revealInViewport, { once: true });

    if (window.location.hash) {
      window.requestAnimationFrame(function () {
        document.querySelectorAll("[data-reveal]").forEach(function (node) {
          node.classList.add("is-visible");
          observer.unobserve(node);
        });
      });
    }
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (node) {
      node.classList.add("is-visible");
    });
  }
});

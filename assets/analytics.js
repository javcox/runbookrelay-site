(function () {
  const config = window.RUNBOOK_RELAY_CONFIG || {};
  const analytics = config.analytics || {};
  const state = {
    sentScrollMilestones: new Set(),
    sentTimeMilestones: new Set(),
    lcpValue: null,
    clsValue: 0,
    analyticsInitialized: false,
    analyticsRequested: false,
    pendingEvents: []
  };

  function debugLog() {
    if (analytics.debug) {
      console.log.apply(console, ["[RunbookRelay analytics]"].concat(Array.from(arguments)));
    }
  }

  function loadScript(src, attributeName, onload) {
    if (document.querySelector("script[" + attributeName + "]")) {
      if (onload) {
        onload();
      }
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.setAttribute(attributeName, "true");
    if (onload) {
      script.onload = onload;
    }
    document.head.appendChild(script);
  }

  function initGa4() {
    if (!analytics.ga4MeasurementId || analytics.ga4MeasurementId === "G-XXXXXXXXXX") {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function () {
        window.dataLayer.push(arguments);
      };

    window.gtag("js", new Date());
    window.gtag("config", analytics.ga4MeasurementId, {
      send_page_view: true,
      link_attribution: true
    });

    loadScript(
      "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(analytics.ga4MeasurementId),
      "data-rr-ga4",
      function () {
        debugLog("GA4 ready");
      }
    );
  }

  function initClarity() {
    if (!analytics.clarityProjectId || document.querySelector("script[data-rr-clarity]")) {
      return;
    }

    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      t.setAttribute("data-rr-clarity", "true");
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", analytics.clarityProjectId);
    debugLog("Clarity requested");
  }

  function initPosthog() {
    if (!analytics.posthogApiKey) {
      return;
    }

    const apiHost = (analytics.posthogApiHost || "https://us.i.posthog.com").replace(/\/$/, "");

    !(function (t, e) {
      let o;
      let p;
      let r;
      e.__SV ||
        ((window.posthog = e),
        (e._i = []),
        (e.init = function (i, s, a) {
          function g(target, method) {
            const parts = method.split(".");
            if (parts.length === 2) {
              target = target[parts[0]];
              method = parts[1];
            }
            target[method] = function () {
              target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
            };
          }
          p = t.createElement("script");
          p.type = "text/javascript";
          p.crossOrigin = "anonymous";
          p.async = true;
          p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
          p.setAttribute("data-rr-posthog", "true");
          r = t.getElementsByTagName("script")[0];
          r.parentNode.insertBefore(p, r);

          const instance = a ? (e[a] = []) : e;
          if (!a) {
            a = "posthog";
          }
          instance.people = instance.people || [];
          instance.toString = function (stub) {
            let label = "posthog";
            if ("posthog" !== a) {
              label += "." + a;
            }
            if (!stub) {
              label += " (stub)";
            }
            return label;
          };
          instance.people.toString = function () {
            return instance.toString(1) + ".people (stub)";
          };
          const methods =
            "capture identify alias people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(
              " "
            );
          for (o = 0; o < methods.length; o += 1) {
            g(instance, methods[o]);
          }
          e._i.push([i, s, a]);
        }),
        (e.__SV = 1));
    })(document, window.posthog || []);

    window.posthog.init(analytics.posthogApiKey, {
      api_host: apiHost,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      person_profiles: "identified_only",
      persistence: "localStorage+cookie"
    });

    debugLog("PostHog requested");
  }

  function sanitizeProps(props) {
    return Object.fromEntries(
      Object.entries(props || {}).filter(function (entry) {
        return entry[1] !== undefined && entry[1] !== null && entry[1] !== "";
      })
    );
  }

  function dispatchEvent(name, payload) {
    if (window.gtag && analytics.ga4MeasurementId && analytics.ga4MeasurementId !== "G-XXXXXXXXXX") {
      window.gtag("event", name, payload);
    }

    if (window.posthog && typeof window.posthog.capture === "function" && analytics.posthogApiKey) {
      window.posthog.capture(name, payload);
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: name,
      event_payload: payload
    });

    debugLog("tracked", name, payload);
  }

  function flushPendingEvents() {
    if (!state.analyticsInitialized || !state.pendingEvents.length) {
      return;
    }

    const queuedEvents = state.pendingEvents.splice(0, state.pendingEvents.length);
    queuedEvents.forEach(function (entry) {
      dispatchEvent(entry.name, entry.payload);
    });
  }

  function initializeAnalytics(reason) {
    if (state.analyticsInitialized) {
      return;
    }

    state.analyticsInitialized = true;
    initGa4();
    initPosthog();
    initClarity();
    flushPendingEvents();
    dispatchEvent("rr_analytics_initialized", { reason: reason || "unknown" });
  }

  function requestAnalyticsInit(reason) {
    if (state.analyticsRequested) {
      return;
    }

    state.analyticsRequested = true;
    const init = function () {
      initializeAnalytics(reason);
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(init, { timeout: 2200 });
    } else {
      window.setTimeout(init, 1200);
    }
  }

  function trackEvent(name, props) {
    const payload = sanitizeProps(
      Object.assign(
        {
          page_path: window.location.pathname,
          page_title: document.title
        },
        props || {}
      )
    );

    if (!state.analyticsInitialized) {
      state.pendingEvents.push({ name: name, payload: payload });
      return;
    }

    dispatchEvent(name, payload);
  }

  function trackScrollDepth() {
    const doc = document.documentElement;
    const total = Math.max(doc.scrollHeight - window.innerHeight, 1);
    const depth = Math.min(100, Math.round((window.scrollY / total) * 100));
    [25, 50, 75, 90].forEach(function (milestone) {
      if (depth >= milestone && !state.sentScrollMilestones.has(milestone)) {
        state.sentScrollMilestones.add(milestone);
        trackEvent("rr_scroll_depth", { depth_percent: milestone });
      }
    });
  }

  function scheduleTimeMilestones() {
    [15, 30, 60, 120].forEach(function (seconds) {
      window.setTimeout(function () {
        if (!state.sentTimeMilestones.has(seconds)) {
          state.sentTimeMilestones.add(seconds);
          trackEvent("rr_time_on_page", { seconds_on_page: seconds });
        }
      }, seconds * 1000);
    });
  }

  function trackClicks() {
    document.addEventListener("click", function (event) {
      const link = event.target.closest("a");
      if (!link) {
        return;
      }

      const explicitTrackType = link.getAttribute("data-track");
      const explicitLabel = link.getAttribute("data-track-label") || link.textContent.trim();

      if (explicitTrackType) {
        trackEvent("rr_" + explicitTrackType + "_click", {
          label: explicitLabel,
          href: link.href
        });
      }

      if (link.hostname && link.hostname !== window.location.hostname) {
        trackEvent("rr_outbound_click", {
          label: explicitLabel,
          href: link.href,
          hostname: link.hostname
        });
      }
    });
  }

  function trackFaq() {
    document.querySelectorAll("details[data-track='faq']").forEach(function (details) {
      details.addEventListener("toggle", function () {
        if (details.open) {
          trackEvent("rr_faq_open", {
            label: details.getAttribute("data-track-label") || details.querySelector("summary").textContent.trim()
          });
        }
      });
    });
  }

  function trackPerformance() {
    const navigationEntry = performance.getEntriesByType("navigation")[0];
    if (navigationEntry) {
      trackEvent("rr_navigation_timing", {
        ttfb_ms: Math.round(navigationEntry.responseStart),
        dom_interactive_ms: Math.round(navigationEntry.domInteractive),
        load_event_ms: Math.round(navigationEntry.loadEventEnd || navigationEntry.duration)
      });
    }

    performance.getEntriesByType("paint").forEach(function (entry) {
      if (entry.name === "first-contentful-paint") {
        trackEvent("rr_first_contentful_paint", {
          value_ms: Math.round(entry.startTime)
        });
      }
    });

    if ("PerformanceObserver" in window) {
      try {
        new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (entry) {
            state.lcpValue = entry.startTime;
          });
        }).observe({ type: "largest-contentful-paint", buffered: true });
      } catch (_error) {}

      try {
        new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (entry) {
            if (!entry.hadRecentInput) {
              state.clsValue += entry.value;
            }
          });
        }).observe({ type: "layout-shift", buffered: true });
      } catch (_error) {}
    }

    window.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        if (state.lcpValue) {
          trackEvent("rr_largest_contentful_paint", {
            value_ms: Math.round(state.lcpValue)
          });
        }

        if (state.clsValue) {
          trackEvent("rr_cumulative_layout_shift", {
            value: Number(state.clsValue.toFixed(4))
          });
        }
      }
    });
  }

  function bindAnalyticsTriggers() {
    const earlyInteractionHandler = function (event) {
      requestAnalyticsInit("interaction:" + event.type);
    };

    ["pointerdown", "touchstart", "keydown", "scroll"].forEach(function (eventName) {
      window.addEventListener(eventName, earlyInteractionHandler, {
        capture: true,
        passive: eventName !== "keydown",
        once: true
      });
    });

    const scheduleAfterLoad = function () {
      requestAnalyticsInit("idle");
    };

    if (document.readyState === "complete") {
      scheduleAfterLoad();
    } else {
      window.addEventListener("load", scheduleAfterLoad, { once: true });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    trackEvent("rr_page_loaded", {
      section_count: document.querySelectorAll("section").length,
      referrer_host: document.referrer ? new URL(document.referrer).hostname : ""
    });

    trackClicks();
    trackFaq();
    scheduleTimeMilestones();
    trackPerformance();
    bindAnalyticsTriggers();
    window.addEventListener("scroll", trackScrollDepth, { passive: true });
  });

  window.RunbookRelayAnalytics = {
    trackEvent: trackEvent,
    initializeAnalytics: initializeAnalytics
  };
})();

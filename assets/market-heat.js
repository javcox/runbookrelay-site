(function () {
  const STORAGE_KEY = "rr_market_heat_check_v1";

  const defaultState = {
    settings: {
      monthly_contribution: 3000,
      current_dry_powder: 0,
      risk_profile: "aggressive_long_term"
    },
    inputs: {
      cape: 42.53,
      ev_ebitda: 17,
      price_to_sales: 3.73,
      buffett_indicator: 238.8,
      forward_pe: 21.2,
      vix: 16.06,
      aaii_bull_bear_spread: -6.3,
      put_call_ratio: 0.75,
      fear_greed: 55,
      news_sentiment: 20,
      sp500_drawdown_pct: -3,
      percent_above_200_day: 8,
      breadth_score: 70,
      ten_year_yield: 4.5,
      fed_funds: 4.5,
      t10y2y: 0.5,
      high_yield_spread: 3.5,
      m2_yoy: 2
    },
    flags: {
      above_200_day: true,
      below_200_day: false,
      breadth_weak: false,
      credit_spreads_widening: false,
      margins_high: true,
      margins_falling: false,
      revenue_slowing: false,
      earnings_revisions_weak: false,
      mega_cap_concentration_high: true
    },
    seeded: true,
    updatedAt: null
  };

  const fieldConfig = [
    { key: "cape", label: "Shiller CAPE", module: "valuation", step: "0.01" },
    { key: "ev_ebitda", label: "S&P 500 EV/EBITDA", module: "valuation", step: "0.01" },
    { key: "price_to_sales", label: "S&P 500 Price/Sales", module: "valuation", step: "0.01" },
    { key: "buffett_indicator", label: "Buffett Indicator (%)", module: "valuation", step: "0.1" },
    { key: "forward_pe", label: "Forward P/E", module: "valuation", step: "0.01" },
    { key: "vix", label: "VIX", module: "sentiment", step: "0.01" },
    { key: "aaii_bull_bear_spread", label: "AAII Bull-Bear Spread", module: "sentiment", step: "0.1" },
    { key: "put_call_ratio", label: "Put/Call Ratio", module: "sentiment", step: "0.01" },
    { key: "fear_greed", label: "Fear & Greed", module: "sentiment", step: "1" },
    { key: "news_sentiment", label: "News/Social Sentiment", module: "sentiment", step: "1" },
    { key: "sp500_drawdown_pct", label: "S&P 500 Drawdown %", module: "trend", step: "0.1" },
    { key: "percent_above_200_day", label: "% Above 200-Day", module: "trend", step: "0.1" },
    { key: "breadth_score", label: "Breadth Score", module: "trend", step: "1" },
    { key: "ten_year_yield", label: "10Y Treasury Yield", module: "liquidity", step: "0.01" },
    { key: "fed_funds", label: "Fed Funds Rate", module: "liquidity", step: "0.01" },
    { key: "t10y2y", label: "10Y-2Y Curve", module: "liquidity", step: "0.01" },
    { key: "high_yield_spread", label: "High-Yield Spread", module: "liquidity", step: "0.01" },
    { key: "m2_yoy", label: "M2 YoY %", module: "liquidity", step: "0.1" }
  ];

  const flagConfig = [
    { key: "above_200_day", label: "S&P 500 above 200-day" },
    { key: "below_200_day", label: "S&P 500 below 200-day" },
    { key: "breadth_weak", label: "Breadth is weak" },
    { key: "credit_spreads_widening", label: "Credit spreads widening" },
    { key: "margins_high", label: "Margins are high" },
    { key: "margins_falling", label: "Margins are falling" },
    { key: "revenue_slowing", label: "Revenue growth slowing" },
    { key: "earnings_revisions_weak", label: "Earnings revisions weak" },
    { key: "mega_cap_concentration_high", label: "Mega-cap concentration high" }
  ];

  function clampScore(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function isNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function scoreCape(cape) {
    if (cape < 15) return 5;
    if (cape < 20) return 20;
    if (cape < 25) return 40;
    if (cape < 30) return 55;
    if (cape < 35) return 70;
    if (cape < 40) return 85;
    return 100;
  }

  function scoreEvEbitda(value) {
    if (value < 9) return 5;
    if (value < 11) return 20;
    if (value < 13) return 40;
    if (value < 15) return 55;
    if (value < 18) return 75;
    if (value < 20) return 88;
    return 100;
  }

  function scorePriceToSales(ps) {
    if (ps < 1.2) return 5;
    if (ps < 1.8) return 25;
    if (ps < 2.5) return 50;
    if (ps < 3.2) return 75;
    if (ps < 3.8) return 90;
    return 100;
  }

  function scoreBuffettIndicator(percent) {
    if (percent < 80) return 5;
    if (percent < 110) return 25;
    if (percent < 150) return 50;
    if (percent < 200) return 80;
    return 100;
  }

  function scoreForwardPe(pe) {
    if (pe < 12) return 10;
    if (pe < 15) return 25;
    if (pe < 18) return 45;
    if (pe < 22) return 65;
    if (pe < 26) return 85;
    return 100;
  }

  function scoreVix(vix) {
    if (vix > 50) return 0;
    if (vix > 40) return 10;
    if (vix > 30) return 25;
    if (vix > 20) return 50;
    if (vix > 13) return 70;
    return 90;
  }

  function scoreAaiiBullBear(spread) {
    if (spread < -30) return 10;
    if (spread < -15) return 25;
    if (spread < 0) return 40;
    if (spread < 20) return 60;
    if (spread < 35) return 80;
    return 95;
  }

  function scorePutCallRatio(ratio) {
    if (ratio > 1.4) return 10;
    if (ratio > 1.1) return 25;
    if (ratio > 0.9) return 45;
    if (ratio > 0.7) return 70;
    return 90;
  }

  function scoreFearGreed(value) {
    return clampScore(value);
  }

  function scoreNewsSentiment(value) {
    return clampScore((value + 100) / 2);
  }

  function scoreDrawdown(drawdownPct) {
    const dd = Math.abs(drawdownPct);
    if (dd > 40) return 0;
    if (dd > 30) return 10;
    if (dd > 25) return 20;
    if (dd > 20) return 30;
    if (dd > 15) return 45;
    if (dd > 10) return 60;
    if (dd > 5) return 75;
    return 90;
  }

  function scoreMovingAverageStatus(data) {
    if (!data.above200Day) return 35;
    if (isNumber(data.percentAbove200Day)) {
      if (data.percentAbove200Day > 15) return 95;
      if (data.percentAbove200Day > 10) return 85;
      if (data.percentAbove200Day > 5) return 75;
      return 60;
    }
    return 70;
  }

  function scoreBreadth(value) {
    return clampScore(value);
  }

  function scoreTenYearYield(yieldPct) {
    if (yieldPct < 2) return 20;
    if (yieldPct < 3) return 35;
    if (yieldPct < 4) return 55;
    if (yieldPct < 5) return 75;
    return 90;
  }

  function scoreFedFunds(rate) {
    if (rate < 1) return 15;
    if (rate < 2.5) return 35;
    if (rate < 4) return 60;
    if (rate < 5.5) return 80;
    return 95;
  }

  function scoreYieldCurve(t10y2y) {
    if (t10y2y < -1) return 85;
    if (t10y2y < 0) return 75;
    if (t10y2y < 1) return 50;
    return 35;
  }

  function scoreHighYieldSpread(spread) {
    if (spread < 3) return 85;
    if (spread < 5) return 60;
    if (spread < 8) return 45;
    return 35;
  }

  function scoreM2Trend(yoyPct) {
    if (yoyPct < -3) return 90;
    if (yoyPct < 0) return 75;
    if (yoyPct < 5) return 50;
    if (yoyPct < 10) return 35;
    return 25;
  }

  function scoreEarningsQuality(flags) {
    let score = 35;
    if (flags.margins_high) score += 10;
    if (flags.margins_falling) score += 25;
    if (flags.revenue_slowing) score += 15;
    if (flags.earnings_revisions_weak) score += 15;
    if (flags.mega_cap_concentration_high) score += 10;
    return Math.min(score, 100);
  }

  function scoreTrendBreakdown(data) {
    let score = 0;
    if (data.below200Day) score += 35;
    if (Math.abs(data.drawdownPct) > 10) score += 25;
    if (Math.abs(data.drawdownPct) > 20) score += 15;
    if (data.breadthWeak) score += 15;
    if (data.creditSpreadsWidening) score += 10;
    return Math.min(score, 100);
  }

  function weightedAverage(items) {
    const available = items.filter(function (item) {
      return isNumber(item.value);
    });
    const weightTotal = available.reduce(function (total, item) {
      return total + item.weight;
    }, 0);
    if (!weightTotal) return { score: null, missing: items.map(function (item) { return item.key; }) };
    const score = available.reduce(function (total, item) {
      return total + item.value * item.weight;
    }, 0) / weightTotal;
    const missing = items.filter(function (item) {
      return !isNumber(item.value);
    }).map(function (item) {
      return item.key;
    });
    return { score: Math.round(score), missing: missing };
  }

  function buildMetric(key, label, raw, score, module) {
    return {
      key: key,
      label: label,
      module: module,
      value: isNumber(raw) ? raw : null,
      score: isNumber(score) ? score : null,
      status: isNumber(score) ? getScoreLabel(score) : "Missing",
      source: isNumber(raw) ? "manual/default" : "missing"
    };
  }

  function calculateValuation(inputs) {
    const metrics = [
      buildMetric("cape", "Shiller CAPE", inputs.cape, isNumber(inputs.cape) ? scoreCape(inputs.cape) : null, "Valuation"),
      buildMetric("ev_ebitda", "S&P 500 EV/EBITDA", inputs.ev_ebitda, isNumber(inputs.ev_ebitda) ? scoreEvEbitda(inputs.ev_ebitda) : null, "Valuation"),
      buildMetric("price_to_sales", "S&P 500 Price/Sales", inputs.price_to_sales, isNumber(inputs.price_to_sales) ? scorePriceToSales(inputs.price_to_sales) : null, "Valuation"),
      buildMetric("buffett_indicator", "Buffett Indicator", inputs.buffett_indicator, isNumber(inputs.buffett_indicator) ? scoreBuffettIndicator(inputs.buffett_indicator) : null, "Valuation"),
      buildMetric("forward_pe", "Forward P/E", inputs.forward_pe, isNumber(inputs.forward_pe) ? scoreForwardPe(inputs.forward_pe) : null, "Valuation")
    ];
    const result = weightedAverage([
      { key: "cape", value: metrics[0].score, weight: 0.3 },
      { key: "ev_ebitda", value: metrics[1].score, weight: 0.25 },
      { key: "price_to_sales", value: metrics[2].score, weight: 0.2 },
      { key: "buffett_indicator", value: metrics[3].score, weight: 0.15 },
      { key: "forward_pe", value: metrics[4].score, weight: 0.1 }
    ]);
    return { score: result.score || 0, metrics: metrics, missing: result.missing };
  }

  function calculateSentiment(inputs) {
    const metrics = [
      buildMetric("vix", "VIX", inputs.vix, isNumber(inputs.vix) ? scoreVix(inputs.vix) : null, "Sentiment"),
      buildMetric("aaii_bull_bear_spread", "AAII Bull-Bear Spread", inputs.aaii_bull_bear_spread, isNumber(inputs.aaii_bull_bear_spread) ? scoreAaiiBullBear(inputs.aaii_bull_bear_spread) : null, "Sentiment"),
      buildMetric("put_call_ratio", "Put/Call Ratio", inputs.put_call_ratio, isNumber(inputs.put_call_ratio) ? scorePutCallRatio(inputs.put_call_ratio) : null, "Sentiment"),
      buildMetric("fear_greed", "Fear & Greed", inputs.fear_greed, isNumber(inputs.fear_greed) ? scoreFearGreed(inputs.fear_greed) : null, "Sentiment"),
      buildMetric("news_sentiment", "News/Social Sentiment", inputs.news_sentiment, isNumber(inputs.news_sentiment) ? scoreNewsSentiment(inputs.news_sentiment) : null, "Sentiment")
    ];
    const result = weightedAverage([
      { key: "vix", value: metrics[0].score, weight: 0.3 },
      { key: "aaii_bull_bear_spread", value: metrics[1].score, weight: 0.25 },
      { key: "put_call_ratio", value: metrics[2].score, weight: 0.2 },
      { key: "fear_greed", value: metrics[3].score, weight: 0.15 },
      { key: "news_sentiment", value: metrics[4].score, weight: 0.1 }
    ]);
    return { score: result.score || 0, metrics: metrics, missing: result.missing };
  }

  function calculateTrend(inputs, flags) {
    const movingAverageScore = scoreMovingAverageStatus({
      above200Day: Boolean(flags.above_200_day),
      percentAbove200Day: inputs.percent_above_200_day
    });
    const metrics = [
      buildMetric("sp500_drawdown_pct", "S&P 500 Drawdown", inputs.sp500_drawdown_pct, isNumber(inputs.sp500_drawdown_pct) ? scoreDrawdown(inputs.sp500_drawdown_pct) : null, "Trend"),
      buildMetric("moving_average", "200-Day Moving Average", flags.above_200_day ? 1 : 0, movingAverageScore, "Trend"),
      buildMetric("breadth_score", "Breadth Score", inputs.breadth_score, isNumber(inputs.breadth_score) ? scoreBreadth(inputs.breadth_score) : null, "Trend")
    ];
    const result = weightedAverage([
      { key: "sp500_drawdown_pct", value: metrics[0].score, weight: 0.5 },
      { key: "moving_average", value: metrics[1].score, weight: 0.3 },
      { key: "breadth_score", value: metrics[2].score, weight: 0.2 }
    ]);
    return { score: result.score || 0, metrics: metrics, missing: result.missing };
  }

  function calculateLiquidity(inputs) {
    const metrics = [
      buildMetric("ten_year_yield", "10Y Treasury Yield", inputs.ten_year_yield, isNumber(inputs.ten_year_yield) ? scoreTenYearYield(inputs.ten_year_yield) : null, "Liquidity"),
      buildMetric("fed_funds", "Fed Funds", inputs.fed_funds, isNumber(inputs.fed_funds) ? scoreFedFunds(inputs.fed_funds) : null, "Liquidity"),
      buildMetric("t10y2y", "10Y-2Y Yield Curve", inputs.t10y2y, isNumber(inputs.t10y2y) ? scoreYieldCurve(inputs.t10y2y) : null, "Liquidity"),
      buildMetric("high_yield_spread", "High-Yield Spread", inputs.high_yield_spread, isNumber(inputs.high_yield_spread) ? scoreHighYieldSpread(inputs.high_yield_spread) : null, "Liquidity"),
      buildMetric("m2_yoy", "M2 YoY Trend", inputs.m2_yoy, isNumber(inputs.m2_yoy) ? scoreM2Trend(inputs.m2_yoy) : null, "Liquidity")
    ];
    const result = weightedAverage([
      { key: "ten_year_yield", value: metrics[0].score, weight: 0.3 },
      { key: "fed_funds", value: metrics[1].score, weight: 0.25 },
      { key: "t10y2y", value: metrics[2].score, weight: 0.2 },
      { key: "high_yield_spread", value: metrics[3].score, weight: 0.15 },
      { key: "m2_yoy", value: metrics[4].score, weight: 0.1 }
    ]);
    return { score: result.score || 0, metrics: metrics, missing: result.missing };
  }

  function getRegime(score) {
    if (score < 20) return "DEEP_BUY";
    if (score < 35) return "ATTRACTIVE";
    if (score < 55) return "NORMAL";
    if (score < 70) return "EXPENSIVE";
    if (score < 85) return "VERY_EXPENSIVE";
    return "EXTREME";
  }

  function getRegimeLabel(regime) {
    return {
      DEEP_BUY: "Deep Buy",
      ATTRACTIVE: "Attractive",
      NORMAL: "Normal",
      EXPENSIVE: "Expensive",
      VERY_EXPENSIVE: "Very Expensive",
      EXTREME: "Extreme"
    }[regime] || "Normal";
  }

  function getScoreLabel(score) {
    if (score < 20) return "Deep Buy";
    if (score < 35) return "Attractive";
    if (score < 55) return "Normal";
    if (score < 70) return "Expensive";
    if (score < 85) return "Very Expensive";
    return "Extreme";
  }

  function getScoreColor(score) {
    if (score < 20) return "green";
    if (score < 35) return "emerald";
    if (score < 55) return "blue";
    if (score < 70) return "yellow";
    if (score < 85) return "orange";
    return "red";
  }

  function getContributionSplit(score, monthlyAmount) {
    let stockPct;
    let cashPct;
    if (score < 20) {
      stockPct = 1.25;
      cashPct = 0;
    } else if (score < 35) {
      stockPct = 1.1;
      cashPct = 0;
    } else if (score < 55) {
      stockPct = 1;
      cashPct = 0;
    } else if (score < 70) {
      stockPct = 0.8;
      cashPct = 0.2;
    } else if (score < 85) {
      stockPct = 0.6;
      cashPct = 0.4;
    } else {
      stockPct = 0.4;
      cashPct = 0.6;
    }
    return {
      stocks: Math.round(monthlyAmount * stockPct),
      cash: Math.round(monthlyAmount * cashPct),
      stockPct: stockPct,
      cashPct: cashPct
    };
  }

  function getRecommendationText(score) {
    if (score < 20) return "Invest aggressively. Deploy extra if available.";
    if (score < 35) return "Buy more than normal.";
    if (score < 55) return "Invest normally.";
    if (score < 70) return "Invest, but build some cash.";
    if (score < 85) return "Build cash with new contributions.";
    return "Heavy dry powder. Avoid lump-sum buying.";
  }

  function getDryPowderDeployment(drawdownPct, heatScore) {
    const dd = Math.abs(drawdownPct);
    if (dd >= 40 && heatScore < 35) return 1;
    if (dd >= 35 && heatScore < 40) return 0.8;
    if (dd >= 30 && heatScore < 45) return 0.6;
    if (dd >= 25 && heatScore < 50) return 0.4;
    if (dd >= 20 && heatScore < 55) return 0.25;
    if (dd >= 15 && heatScore < 60) return 0.15;
    if (dd >= 10 && heatScore < 65) return 0.1;
    return 0;
  }

  function getSellPressure(data) {
    return Math.round(data.valuationScore * 0.45 + data.sentimentScore * 0.25 + data.trendBreakdownScore * 0.2 + data.liquidityScore * 0.1);
  }

  function getSellRecommendation(sellPressure) {
    if (sellPressure < 50) {
      return { label: "NO_SELL", action: "Stay invested. Manage new contributions normally.", sellPercent: 0 };
    }
    if (sellPressure < 70) {
      return { label: "TRIM_RISK", action: "Do not sell core holdings. Reduce new risk exposure and build cash.", sellPercent: 0 };
    }
    if (sellPressure < 85) {
      return { label: "DE_RISK", action: "Consider trimming 5-10% of aggressive positions if overweight.", sellPercent: 10 };
    }
    if (sellPressure < 95) {
      return { label: "PARTIAL_SELL", action: "Consider selling 10-25% of risk assets and moving proceeds to T-bills/cash.", sellPercent: 25 };
    }
    return { label: "MAJOR_SELL", action: "Consider selling 25-50% of risk assets. Avoid full exit unless using a separate active trading plan.", sellPercent: 50 };
  }

  function classifyBubblePhase(data) {
    if (data.valuationScore > 90 && data.sentimentScore > 80 && data.trendBreakdownScore < 40) return "BUBBLE_ACCELERATION";
    if (data.valuationScore > 90 && data.sentimentScore > 80 && data.trendBreakdownScore >= 60) return "BUBBLE_BREAKING";
    if (data.valuationScore > 80 && data.sentimentScore > 70) return "HIGH_RISK_EXPENSIVE";
    return "NORMAL_REGIME";
  }

  function getBubbleMeaning(phase) {
    return {
      NORMAL_REGIME: "Market is not showing full bubble conditions.",
      HIGH_RISK_EXPENSIVE: "Market is expensive and sentiment is elevated. Build cash from new contributions.",
      BUBBLE_ACCELERATION: "Market is extremely expensive and euphoric, but trend has not broken. Build cash heavily. Avoid shorting or full exit.",
      BUBBLE_BREAKING: "Market is extremely expensive, euphoric, and trend is deteriorating. Partial sell/hedge signals are active."
    }[phase] || "Market is not showing full bubble conditions.";
  }

  function isHardSellWarning(data) {
    return data.valuationScore > 95 && data.sentimentScore > 90 && data.liquidityScore > 80 && data.trendBreakdownScore > 70;
  }

  function calculateDashboard(state) {
    const inputs = state.inputs || {};
    const flags = state.flags || {};
    const settings = state.settings || {};
    const valuation = calculateValuation(inputs);
    const sentiment = calculateSentiment(inputs);
    const trend = calculateTrend(inputs, flags);
    const liquidity = calculateLiquidity(inputs);
    const earningsScore = scoreEarningsQuality(flags);
    const moduleAverage = weightedAverage([
      { key: "valuation", value: valuation.score, weight: 0.4 },
      { key: "sentiment", value: sentiment.score, weight: 0.2 },
      { key: "trend", value: trend.score, weight: 0.15 },
      { key: "liquidity", value: liquidity.score, weight: 0.15 },
      { key: "earnings", value: earningsScore, weight: 0.1 }
    ]);
    const marketHeatScore = moduleAverage.score || 0;
    const trendBreakdownScore = scoreTrendBreakdown({
      below200Day: Boolean(flags.below_200_day),
      drawdownPct: inputs.sp500_drawdown_pct || 0,
      breadthWeak: Boolean(flags.breadth_weak),
      creditSpreadsWidening: Boolean(flags.credit_spreads_widening)
    });
    const sellPressureScore = getSellPressure({
      valuationScore: valuation.score,
      sentimentScore: sentiment.score,
      trendBreakdownScore: trendBreakdownScore,
      liquidityScore: liquidity.score
    });
    const sellRecommendation = getSellRecommendation(sellPressureScore);
    const bubblePhase = classifyBubblePhase({
      valuationScore: valuation.score,
      sentimentScore: sentiment.score,
      trendBreakdownScore: trendBreakdownScore
    });
    const contribution = getContributionSplit(marketHeatScore, Number(settings.monthly_contribution) || 0);
    const deploymentPct = getDryPowderDeployment(Number(inputs.sp500_drawdown_pct) || 0, marketHeatScore);
    const currentDryPowder = Number(settings.current_dry_powder) || 0;
    const metrics = valuation.metrics.concat(sentiment.metrics, trend.metrics, liquidity.metrics, [
      buildMetric("earnings_quality", "Earnings Quality", null, earningsScore, "Earnings"),
      buildMetric("trend_breakdown", "Trend Breakdown", null, trendBreakdownScore, "Sell Pressure")
    ]);

    return {
      date: new Date().toISOString(),
      marketHeatScore: marketHeatScore,
      regime: getRegime(marketHeatScore),
      valuationScore: valuation.score,
      sentimentScore: sentiment.score,
      trendScore: trend.score,
      liquidityScore: liquidity.score,
      earningsScore: earningsScore,
      trendBreakdownScore: trendBreakdownScore,
      sellPressureScore: sellPressureScore,
      sellSignal: sellRecommendation.label,
      bubblePhase: bubblePhase,
      bubbleMeaning: getBubbleMeaning(bubblePhase),
      contribution: contribution,
      monthlyContribution: Number(settings.monthly_contribution) || 0,
      dryPowder: {
        currentDryPowder: currentDryPowder,
        deploymentPct: deploymentPct,
        deploymentAmount: Math.round(currentDryPowder * deploymentPct)
      },
      recommendation: getRecommendationText(marketHeatScore),
      sellRecommendation: sellRecommendation,
      metrics: metrics,
      missingMetrics: valuation.missing.concat(sentiment.missing, trend.missing, liquidity.missing),
      hardSellWarning: isHardSellWarning({
        valuationScore: valuation.score,
        sentimentScore: sentiment.score,
        liquidityScore: liquidity.score,
        trendBreakdownScore: trendBreakdownScore
      })
    };
  }

  function deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return deepCopy(defaultState);
      const parsed = JSON.parse(saved);
      return {
        settings: Object.assign({}, defaultState.settings, parsed.settings || {}),
        inputs: Object.assign({}, defaultState.inputs, parsed.inputs || {}),
        flags: Object.assign({}, defaultState.flags, parsed.flags || {}),
        seeded: Boolean(parsed.seeded),
        updatedAt: parsed.updatedAt || null
      };
    } catch (error) {
      return deepCopy(defaultState);
    }
  }

  function saveState(state) {
    state.updatedAt = new Date().toISOString();
    state.seeded = false;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function formatNumber(value, decimals) {
    if (!isNumber(value)) return "-";
    return Number(value).toLocaleString(undefined, {
      maximumFractionDigits: decimals == null ? 1 : decimals,
      minimumFractionDigits: 0
    });
  }

  function formatMoney(value) {
    return "$" + formatNumber(Math.round(value), 0);
  }

  function pct(value) {
    return Math.round(value * 100) + "%";
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setScore(id, score) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = String(score);
    el.dataset.scoreColor = getScoreColor(score);
  }

  function renderMetricTable(metrics) {
    const tableBody = document.querySelector("[data-market-metrics]");
    if (!tableBody) return;
    tableBody.innerHTML = metrics.map(function (metric) {
      const color = isNumber(metric.score) ? getScoreColor(metric.score) : "muted";
      return (
        "<tr>" +
        "<td>" + metric.label + "<span>" + metric.module + "</span></td>" +
        "<td>" + (isNumber(metric.value) ? formatNumber(metric.value, 2) : "-") + "</td>" +
        "<td><strong data-score-color=\"" + color + "\">" + (isNumber(metric.score) ? metric.score : "-") + "</strong></td>" +
        "<td>" + metric.status + "</td>" +
        "<td>" + metric.source + "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderMissing(missing) {
    const el = document.querySelector("[data-missing-metrics]");
    if (!el) return;
    if (!missing.length) {
      el.textContent = "No missing metrics. Manual/default data is available for the current model.";
      return;
    }
    el.textContent = missing.join(", ");
  }

  function renderDashboard(state) {
    const result = calculateDashboard(state);
    setScore("market-heat-score", result.marketHeatScore);
    setScore("sell-pressure-score", result.sellPressureScore);
    setText("market-regime", getRegimeLabel(result.regime));
    setText("new-money-action", result.recommendation);
    setText("new-money-split", Math.round(result.contribution.stockPct * 100) + "% stocks / " + Math.round(result.contribution.cashPct * 100) + "% cash or T-bills");
    setText("new-money-dollars", formatMoney(result.contribution.stocks) + " stocks / " + formatMoney(result.contribution.cash) + " cash");
    setText("sell-signal", result.sellRecommendation.label.replace(/_/g, " "));
    setText("sell-action", result.sellRecommendation.action);
    setText("bubble-phase", result.bubblePhase.replace(/_/g, " "));
    setText("bubble-meaning", result.bubbleMeaning);
    setText("dry-powder-deploy", pct(result.dryPowder.deploymentPct));
    setText("dry-powder-dollars", formatMoney(result.dryPowder.deploymentAmount) + " of " + formatMoney(result.dryPowder.currentDryPowder));
    setText("last-refreshed", new Date(result.date).toLocaleString());
    setText("valuation-score", String(result.valuationScore));
    setText("sentiment-score", String(result.sentimentScore));
    setText("trend-score", String(result.trendScore));
    setText("liquidity-score", String(result.liquidityScore));
    setText("earnings-score", String(result.earningsScore));
    setText("trend-breakdown-score", String(result.trendBreakdownScore));

    const seedNotice = document.querySelector("[data-seed-notice]");
    if (seedNotice) seedNotice.hidden = !state.seeded;

    const hardSell = document.querySelector("[data-hard-sell-warning]");
    if (hardSell) hardSell.hidden = !result.hardSellWarning;

    renderMetricTable(result.metrics);
    renderMissing(result.missingMetrics);
  }

  function buildInputs(state) {
    const numericHost = document.querySelector("[data-numeric-inputs]");
    const flagHost = document.querySelector("[data-flag-inputs]");
    if (numericHost) {
      numericHost.innerHTML = fieldConfig.map(function (field) {
        const value = state.inputs[field.key];
        return (
          "<label class=\"mh-field\">" +
          "<span>" + field.label + "</span>" +
          "<input type=\"number\" step=\"" + field.step + "\" data-market-input=\"" + field.key + "\" value=\"" + (isNumber(value) ? value : "") + "\" />" +
          "</label>"
        );
      }).join("");
    }
    if (flagHost) {
      flagHost.innerHTML = flagConfig.map(function (flag) {
        return (
          "<label class=\"mh-check\">" +
          "<input type=\"checkbox\" data-market-flag=\"" + flag.key + "\"" + (state.flags[flag.key] ? " checked" : "") + " />" +
          "<span>" + flag.label + "</span>" +
          "</label>"
        );
      }).join("");
    }
  }

  function hydrateSettings(state) {
    document.querySelectorAll("[data-market-setting]").forEach(function (input) {
      const key = input.getAttribute("data-market-setting");
      if (key && state.settings[key] != null) {
        input.value = state.settings[key];
      }
    });
  }

  function readFormState(state) {
    const next = deepCopy(state);
    document.querySelectorAll("[data-market-input]").forEach(function (input) {
      const key = input.getAttribute("data-market-input");
      const value = input.value.trim();
      next.inputs[key] = value === "" ? null : Number(value);
    });
    document.querySelectorAll("[data-market-flag]").forEach(function (input) {
      const key = input.getAttribute("data-market-flag");
      next.flags[key] = input.checked;
    });
    document.querySelectorAll("[data-market-setting]").forEach(function (input) {
      const key = input.getAttribute("data-market-setting");
      next.settings[key] = input.type === "number" ? Number(input.value || 0) : input.value;
    });
    return next;
  }

  function bind() {
    const root = document.querySelector("[data-market-heat-dashboard]");
    if (!root) return;
    let state = loadState();
    buildInputs(state);
    hydrateSettings(state);
    renderDashboard(state);

    const form = document.querySelector("[data-market-form]");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        state = readFormState(state);
        saveState(state);
        renderDashboard(state);
        const status = document.querySelector("[data-market-status]");
        if (status) status.textContent = "Saved and recalculated at " + new Date().toLocaleTimeString() + ".";
      });
    }

    const reset = document.querySelector("[data-market-reset]");
    if (reset) {
      reset.addEventListener("click", function () {
        state = deepCopy(defaultState);
        window.localStorage.removeItem(STORAGE_KEY);
        buildInputs(state);
        hydrateSettings(state);
        renderDashboard(state);
      });
    }
  }

  window.MarketHeatCheck = {
    calculateDashboard: calculateDashboard,
    scoreCape: scoreCape,
    scoreEvEbitda: scoreEvEbitda,
    scorePriceToSales: scorePriceToSales,
    scoreVix: scoreVix,
    scoreDrawdown: scoreDrawdown,
    getRegime: getRegime,
    getContributionSplit: getContributionSplit,
    getDryPowderDeployment: getDryPowderDeployment,
    getSellPressure: getSellPressure,
    getSellRecommendation: getSellRecommendation,
    classifyBubblePhase: classifyBubblePhase,
    defaultState: defaultState
  };

  document.addEventListener("DOMContentLoaded", bind);
})();

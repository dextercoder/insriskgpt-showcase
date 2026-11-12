(function () {
  var D = window.INSRISK_DATA;
  if (!D) return;

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var danger = style.getPropertyValue('--danger').trim();
  var amber = style.getPropertyValue('--amber').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var font = "'Instrument Sans','PingFang SC','Hiragino Sans GB','Noto Sans SC','Microsoft YaHei',sans-serif";
  var baseText = { fontFamily: font, color: muted, fontSize: 11 };

  function init(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    var c = echarts.init(el, null, { renderer: 'svg' });
    window.addEventListener('resize', function () { c.resize(); });
    return c;
  }

  function titleText(text) {
    return {
      text: text,
      left: 0,
      top: 0,
      textStyle: { color: ink, fontSize: 12, fontWeight: 600, fontFamily: font }
    };
  }

  function tooltip(extra) {
    var t = {
      appendToBody: true,
      backgroundColor: ink,
      borderWidth: 0,
      padding: [8, 11],
      textStyle: { color: bg2, fontSize: 12, fontFamily: font }
    };
    if (extra) {
      for (var k in extra) { t[k] = extra[k]; }
    }
    return t;
  }

  var axisCommon = {
    axisLine: { lineStyle: { color: rule } },
    axisTick: { show: false },
    axisLabel: { color: muted, fontFamily: font, fontSize: 11 },
    splitLine: { lineStyle: { color: rule, type: 'dashed' } }
  };

  var PRODUCTS = ['HLT_MED_2026', 'AUTO_COMP_2026', 'RTS_2026'];
  var PRODUCT_LABEL = { HLT_MED_2026: '健康险', AUTO_COMP_2026: '车险', RTS_2026: '退运险' };
  var PRODUCT_COLOR = { HLT_MED_2026: accent, AUTO_COMP_2026: accent3, RTS_2026: accent2 };

  /* ---------- 1. 路由分布 ---------- */
  var route = init('chart-route');
  if (route) {
    route.setOption({
      animation: false,
      tooltip: tooltip({ formatter: '{b}<br/>{c} 次 · {d}%' }),
      legend: {
        bottom: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: muted, fontFamily: font, fontSize: 11 }
      },
      series: [{
        type: 'pie',
        radius: ['58%', '78%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        label: { show: false },
        itemStyle: { borderColor: bg2, borderWidth: 3 },
        data: [
          { value: D.uw.route.fast_path, name: 'fast_path · 传统模型', itemStyle: { color: accent } },
          { value: D.uw.route.llm_deep, name: 'llm_deep · 双引擎', itemStyle: { color: accent2 } }
        ]
      }],
      graphic: [{
        type: 'text',
        left: 'center',
        top: '36%',
        style: {
          text: '79.0%',
          fill: ink,
          font: '700 30px ' + font,
          textAlign: 'center'
        }
      }, {
        type: 'text',
        left: 'center',
        top: '48%',
        style: {
          text: 'fast_path 占比',
          fill: muted,
          font: '11px ' + font,
          textAlign: 'center'
        }
      }]
    });
  }

  /* ---------- 2. 时延对比 ---------- */
  var latency = init('chart-latency');
  if (latency) {
    var lat = D.uw.latency;
    latency.setOption({
      animation: false,
      tooltip: tooltip({ trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: function (v) { return v + ' ms'; } }),
      legend: {
        top: 0,
        right: 0,
        icon: 'roundRect',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: muted, fontFamily: font, fontSize: 11 }
      },
      grid: { left: 8, right: 16, top: 38, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: ['平均', '中位', '最大'],
        axisLine: axisCommon.axisLine,
        axisTick: axisCommon.axisTick,
        axisLabel: axisCommon.axisLabel
      },
      yAxis: {
        type: 'value',
        name: 'ms',
        nameTextStyle: { color: muted, fontFamily: font, fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: axisCommon.axisLabel,
        splitLine: axisCommon.splitLine
      },
      series: [
        {
          name: 'fast_path',
          type: 'bar',
          barWidth: 22,
          itemStyle: { color: accent, borderRadius: [3, 3, 0, 0] },
          label: { show: true, position: 'top', color: muted, fontFamily: font, fontSize: 10, formatter: '{c}' },
          data: [lat.fast_path.mean, lat.fast_path.median, lat.fast_path.max]
        },
        {
          name: 'llm_deep',
          type: 'bar',
          barWidth: 22,
          itemStyle: { color: accent2, borderRadius: [3, 3, 0, 0] },
          label: { show: true, position: 'top', color: muted, fontFamily: font, fontSize: 10, formatter: '{c}' },
          data: [lat.llm_deep.mean, lat.llm_deep.median, lat.llm_deep.max]
        }
      ]
    });
  }

  /* ---------- 3. 核保决策堆叠 ---------- */
  var uw = init('chart-uw-stacked');
  if (uw) {
    var decisions = ['标准承保', '加费承保', '除外承保', '转人工', '拒保'];
    var colors = [accent, accent3, amber, accent2, danger];
    var series = decisions.map(function (d, i) {
      return {
        name: d,
        type: 'bar',
        stack: 'total',
        barWidth: 26,
        itemStyle: { color: colors[i] },
        emphasis: { focus: 'series' },
        data: PRODUCTS.map(function (p) { return D.uw.byProduct[p][d] || 0; })
      };
    });
    uw.setOption({
      animation: false,
      tooltip: tooltip({ trigger: 'axis', axisPointer: { type: 'shadow' } }),
      legend: {
        top: 0,
        left: 0,
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: muted, fontFamily: font, fontSize: 11 }
      },
      grid: { left: 8, right: 20, top: 40, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: axisCommon.axisLabel,
        splitLine: axisCommon.splitLine
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: PRODUCTS.map(function (p) { return PRODUCT_LABEL[p]; }),
        axisLine: axisCommon.axisLine,
        axisTick: { show: false },
        axisLabel: { color: ink, fontFamily: font, fontSize: 12 }
      },
      series: series
    });
  }

  /* ---------- 4. 理赔决策 ---------- */
  var claim = init('chart-claim');
  if (claim) {
    claim.setOption({
      animation: false,
      tooltip: tooltip({ formatter: '{b}<br/>{c} 件 · {d}%' }),
      legend: {
        bottom: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: muted, fontFamily: font, fontSize: 11 }
      },
      series: [{
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['50%', '44%'],
        label: { show: false },
        itemStyle: { borderColor: bg2, borderWidth: 3 },
        data: [
          { value: D.claim.decisions['自动赔付'], name: '自动赔付', itemStyle: { color: accent } },
          { value: D.claim.decisions['转人工调查'], name: '转人工调查', itemStyle: { color: accent2 } },
          { value: D.claim.decisions['拒赔'], name: '拒赔', itemStyle: { color: danger } }
        ]
      }],
      graphic: [{
        type: 'text',
        left: 'center',
        top: '34%',
        style: { text: '223', fill: ink, font: '700 30px ' + font, textAlign: 'center' }
      }, {
        type: 'text',
        left: 'center',
        top: '46%',
        style: { text: '理赔案件', fill: muted, font: '11px ' + font, textAlign: 'center' }
      }, {
        type: 'text',
        left: 'center',
        top: '61%',
        style: { text: '欺诈召回 84.4%', fill: accent2, font: '600 11px ' + font, textAlign: 'center' }
      }]
    });
  }

  /* ---------- 5. 欺诈类型 ---------- */
  var fraudTypes = init('chart-fraud-types');
  if (fraudTypes) {
    var ft = Object.keys(D.claim.fraudTypes).map(function (k) { return { name: k, value: D.claim.fraudTypes[k] }; });
    ft.sort(function (a, b) { return a.value - b.value; });
    fraudTypes.setOption({
      animation: false,
      tooltip: tooltip({ trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>{c} 件' }),
      grid: { left: 8, right: 34, top: 10, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: axisCommon.axisLabel,
        splitLine: axisCommon.splitLine
      },
      yAxis: {
        type: 'category',
        data: ft.map(function (d) { return d.name; }),
        axisLine: axisCommon.axisLine,
        axisTick: { show: false },
        axisLabel: { color: ink, fontFamily: font, fontSize: 11 }
      },
      series: [{
        type: 'bar',
        barWidth: 14,
        itemStyle: { color: accent2, borderRadius: [0, 3, 3, 0] },
        label: { show: true, position: 'right', color: muted, fontFamily: font, fontSize: 10 },
        data: ft.map(function (d) { return d.value; })
      }]
    });
  }

  /* ---------- 6. 续保策略 ---------- */
  var renewal = init('chart-renewal');
  if (renewal) {
    var rs = Object.keys(D.renewal.strategy).map(function (k) { return { name: k, value: D.renewal.strategy[k] }; });
    rs.sort(function (a, b) { return a.value - b.value; });
    renewal.setOption({
      animation: false,
      tooltip: tooltip({ trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>{c} 条' }),
      grid: { left: 8, right: 54, top: 12, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: axisCommon.axisLabel,
        splitLine: axisCommon.splitLine
      },
      yAxis: {
        type: 'category',
        data: rs.map(function (d) { return d.name; }),
        axisLine: axisCommon.axisLine,
        axisTick: { show: false },
        axisLabel: { color: ink, fontFamily: font, fontSize: 11 }
      },
      series: [{
        type: 'bar',
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 3, 3, 0],
          color: function (p) {
            return p.name === '不建议续保' ? danger : (p.name === '加费续保' ? accent2 : accent);
          }
        },
        label: { show: true, position: 'right', color: muted, fontFamily: font, fontSize: 10 },
        data: rs.map(function (d) { return d.value; })
      }]
    });
  }

  /* ---------- 7. 赔付率趋势 ---------- */
  var loss = init('chart-loss');
  if (loss) {
    var dates = D.business.dates.map(function (d) { return d.slice(5); });
    loss.setOption({
      animation: false,
      tooltip: tooltip({ trigger: 'axis', valueFormatter: function (v) { return (v * 100).toFixed(1) + '%'; } }),
      legend: {
        top: 0,
        right: 0,
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 3,
        textStyle: { color: muted, fontFamily: font, fontSize: 11 }
      },
      grid: { left: 8, right: 14, top: 38, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: axisCommon.axisLine,
        axisTick: { show: false },
        axisLabel: { color: muted, fontFamily: font, fontSize: 10, interval: 7 }
      },
      yAxis: {
        type: 'value',
        min: 0.55,
        max: 1.0,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: muted, fontFamily: font, fontSize: 10, formatter: function (v) { return Math.round(v * 100) + '%'; } },
        splitLine: axisCommon.splitLine
      },
      series: PRODUCTS.map(function (p) {
        return {
          name: PRODUCT_LABEL[p],
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: PRODUCT_COLOR[p] },
          itemStyle: { color: PRODUCT_COLOR[p] },
          data: D.business.loss[p]
        };
      })
    });
  }

  /* ---------- 8. 模型 AUC 周度 ---------- */
  var modelTrend = init('chart-model-trend');
  if (modelTrend) {
    var weeks = D.mmTrend.weeks.map(function (w) { return 'W' + w.split('-W')[1]; });
    var trendModels = [
      { id: 'M-HLT-UW-XGB-001', name: '健康险承保 XGB', color: accent },
      { id: 'M-AUTO-CLM-GNN-001', name: '车险团伙 GNN', color: accent3 },
      { id: 'M-FUSION-LR-001', name: '融合层 LR', color: accent2 }
    ];
    modelTrend.setOption({
      animation: false,
      tooltip: tooltip({ trigger: 'axis', valueFormatter: function (v) { return Number(v).toFixed(4); } }),
      legend: {
        top: 0,
        right: 0,
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 3,
        textStyle: { color: muted, fontFamily: font, fontSize: 11 }
      },
      grid: { left: 8, right: 14, top: 38, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: weeks,
        axisLine: axisCommon.axisLine,
        axisTick: { show: false },
        axisLabel: { color: muted, fontFamily: font, fontSize: 10, interval: 5 }
      },
      yAxis: {
        type: 'value',
        min: 0.74,
        max: 0.9,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: muted, fontFamily: font, fontSize: 10 },
        splitLine: axisCommon.splitLine
      },
      series: trendModels.map(function (m) {
        return {
          name: m.name,
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: m.color },
          itemStyle: { color: m.color },
          data: D.mmTrend.models[m.id].auc
        };
      })
    });
  }

  /* ---------- 9. 模型 AUC 排行 ---------- */
  var modelAuc = init('chart-model-auc');
  if (modelAuc) {
    var sorted = D.models.slice().sort(function (a, b) { return a.offline_auc - b.offline_auc; });
    var scenes = [
      { key: 'underwriting', name: '承保 / 核保', color: accent },
      { key: 'claim', name: '理赔反欺诈', color: accent2 },
      { key: 'renewal', name: '续保风险', color: accent3 },
      { key: 'fusion', name: '融合层', color: ink }
    ];
    var series = scenes.map(function (s) {
      return {
        name: s.name,
        type: 'bar',
        barWidth: 13,
        itemStyle: { color: s.color, borderRadius: [0, 3, 3, 0] },
        label: {
          show: true,
          position: 'right',
          color: muted,
          fontFamily: font,
          fontSize: 10,
          formatter: function (p) { return p.value ? Number(p.value).toFixed(3) : ''; }
        },
        data: sorted.map(function (m) {
          return m.scene === s.key ? m.offline_auc : null;
        })
      };
    });
    modelAuc.setOption({
      animation: false,
      tooltip: tooltip({ trigger: 'axis', axisPointer: { type: 'shadow' } }),
      legend: {
        top: 0,
        right: 0,
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: muted, fontFamily: font, fontSize: 11 }
      },
      grid: { left: 8, right: 52, top: 34, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        min: 0.7,
        max: 0.9,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: axisCommon.axisLabel,
        splitLine: axisCommon.splitLine
      },
      yAxis: {
        type: 'category',
        data: sorted.map(function (m) { return m.model_name; }),
        axisLine: axisCommon.axisLine,
        axisTick: { show: false },
        axisLabel: { color: ink, fontFamily: font, fontSize: 11 }
      },
      series: series
    });
  }

})();

(function(f) {
  f(jQuery)
})(function(f) {
  if (!f.support.cors && f.ajaxTransport && window.XDomainRequest) {
    var h = /^https?:\/\//i,
      e = /^get|post$/i,
      a = new RegExp("^" + location.protocol, "i");
    f.ajaxTransport("* text html xml json", function(b, c, g) {
      if (b.crossDomain && b.async && e.test(b.type) && h.test(b.url) && a.test(b.url)) {
        var d = null;
        return {
          send: function(a, e) {
            var g = "",
              l = (c.dataType || "").toLowerCase();
            d = new XDomainRequest;
            /^\d+$/.test(c.timeout) && (d.timeout = c.timeout);
            d.ontimeout = function() {
              e(500, "timeout")
            };
            d.onload = function() {
              var a = "Content-Length: " + d.responseText.length + "\r\nContent-Type: " + d.contentType,
                b = 200,
                c = "success",
                g = {
                  text: d.responseText
                };
              try {
                if ("html" === l || /text\/html/i.test(d.contentType)) g.html = d.responseText;
                else if ("json" === l || "text" !== l && /\/json/i.test(d.contentType)) try {
                  g.json = f.parseJSON(d.responseText)
                } catch (h) {
                  b = 500, c = "parseerror"
                } else if ("xml" === l || "text" !== l && /\/xml/i.test(d.contentType)) {
                  var k = new ActiveXObject("Microsoft.XMLDOM");
                  k.async = !1;
                  try {
                    k.loadXML(d.responseText)
                  } catch (n) {
                    k = void 0
                  }
                  if (!k || !k.documentElement || k.getElementsByTagName("parsererror").length) throw b = 500, c = "parseerror", "Invalid XML: " + d.responseText;
                  g.xml = k
                }
              } catch (m) {
                throw m;
              } finally {
                e(b, c, g, a)
              }
            };
            d.onprogress = function() {};
            d.onerror = function() {
              e(500, "error", {
                text: d.responseText
              })
            };
            c.data && (g = "string" === f.type(c.data) ? c.data : f.param(c.data));
            d.open(b.type, b.url);
            d.send(g)
          },
          abort: function() {
            d && d.abort()
          }
        }
      }
    })
  }
});
"use strict";

function inherit(f, h) {
  var e = function() {};
  e.prototype = h.prototype;
  f.prototype = new e;
  f.prototype.constructor = f;
  f.prototype.superclass = h
}
(function() {
  function f(a) {
    "hideSymbolSearch enabledStudies enabledDrawings disabledDrawings disabledStudies disableLogo hideSideToolbar".split(" ").map(function(b) {
      a[b] && console.warn("Feature `" + b + "` is obsolete. Please see the doc for details.")
    })
  }
  if (!window.TradingView) {
    var h = {
        mobile: {
          disabledFeatures: "left_toolbar header_widget timeframes_toolbar edit_buttons_in_legend context_menus control_bar border_around_the_chart".split(" "),
          enabledFeatures: ["narrow_chart_enabled"]
        }
      },
      e = {
        BARS: 0,
        CANDLES: 1,
        LINE: 2,
        AREA: 3,
        HEIKEN_ASHI: 8,
        HOLLOW_CANDLES: 9,
        version: function() {
          return "1.4 (internal id 6adf7f18 @ 2015-12-10 20:59:31.081309)"
        },
        gEl: function(a) {
          return document.getElementById(a)
        },
        gId: function() {
          return "tradingview_" + (1048576 * (1 + Math.random()) | 0).toString(16).substring(1)
        },
        onready: function(a) {
          window.addEventListener ? window.addEventListener("DOMContentLoaded", a, !1) : window.attachEvent("onload", a)
        },
        css: function(a) {
          var b = document.getElementsByTagName("head")[0],
            c = document.createElement("style");
          c.type = "text/css";
          c.styleSheet ? c.styleSheet.cssText = a : (a = document.createTextNode(a), c.appendChild(a));
          b.appendChild(c)
        },
        bindEvent: function(a, b, c) {
          a.addEventListener ? a.addEventListener(b, c, !1) : a.attachEvent && a.attachEvent("on" + b, c)
        },
        unbindEvent: function(a, b, c) {
          a.removeEventListener ? a.removeEventListener(b, c, !1) : a.detachEvent && a.detachEvent("on" + b, c)
        },
        widget: function(a) {
          this.id = e.gId();
          if (!a.datafeed) throw "Datafeed is not defined";
          var b = {
              width: 800,
              height: 500,
              symbol: "AA",
              interval: "D",
              timezone: "",
              container: "",
              path: "",
              locale: "en",
              toolbar_bg: void 0,
              hideSymbolSearch: !1,
              hideSideToolbar: !1,
              enabledStudies: [],
              enabledDrawings: [],
              disabledDrawings: [],
              disabledStudies: [],
              drawingsAccess: void 0,
              studiesAccess: void 0,
              widgetbar: {
                datawindow: !1,
                details: !1,
                watchlist: !1,
                watchlist_settings: {
                  default_symbols: []
                }
              },
              overrides: {
                "mainSeriesProperties.showCountdown": !1
              },
              studiesOverrides: {},
              fullscreen: !1,
              autosize: !1,
              disabledFeatures: [],
              enabledFeatures: [],
              indicators_file_name: null,
              custom_css_url: null,
              debug: !1,
              time_frames: [{
                text: "5y",
                resolution: "W"
              }, {
                text: "1y",
                resolution: "W"
              }, {
                text: "6m",
                resolution: "120"
              }, {
                text: "3m",
                resolution: "60"
              }, {
                text: "1m",
                resolution: "30"
              }, {
                text: "5d",
                resolution: "5"
              }, {
                text: "1d",
                resolution: "1"
              }],
              client_id: "0",
              user_id: "0",
              charts_storage_url: void 0,
              charts_storage_api_version: "1.0",
              logo: {},
              favorites: {
                intervals: [],
                chartTypes: []
              }
            },
            c = {
              width: a.width,
              height: a.height,
              symbol: a.symbol,
              interval: a.interval,
              timezone: a.timezone,
              container: a.container_id,
              path: a.library_path,
              locale: a.locale,
              toolbar_bg: a.toolbar_bg,
              hideSymbolSearch: a.hide_symbol_search ||
                a.hideSymbolSearch,
              hideSideToolbar: a.hide_side_toolbar,
              enabledStudies: a.enabled_studies,
              disabledStudies: a.disabled_studies,
              enabledDrawings: a.enabled_drawings,
              disabledDrawings: a.disabled_drawings,
              drawingsAccess: a.drawings_access,
              studiesAccess: a.studies_access,
              widgetbar: a.widgetbar,
              overrides: a.overrides,
              studiesOverrides: a.studies_overrides,
              savedData: a.saved_data || a.savedData,
              snapshotUrl: a.snapshot_url,
              uid: this.id,
              datafeed: a.datafeed,
              disableLogo: a.disable_logo || a.disableLogo,
              logo: a.logo,
              autosize: a.autosize,
              fullscreen: a.fullscreen,
              disabledFeatures: a.disabled_features,
              enabledFeatures: a.enabled_features,
              indicators_file_name: a.indicators_file_name,
              custom_css_url: a.custom_css_url,
              debug: a.debug,
              client_id: a.client_id,
              user_id: a.user_id,
              charts_storage_url: a.charts_storage_url,
              charts_storage_api_version: a.charts_storage_api_version,
              favorites: a.favorites,
              numeric_formatting: a.numeric_formatting
            };
          f(c);
          this.options = $.extend(!0, b, c);
          this.options.time_frames = a.time_frames || b.time_frames;
          a.preset && (a = a.preset, h[a] ?
            (a = h[a], this.options.disabledFeatures = 0 < this.options.disabledFeatures.length ? this.options.disabledFeatures.concat(a.disabledFeatures) : a.disabledFeatures, this.options.enabledFeatures = 0 < this.options.enabledFeatures.length ? this.options.enabledFeatures.concat(a.enabledFeatures) : a.enabledFeatures) : console.warn("Unknown preset: `" + a + "`"));
          this._ready_handlers = [];
          this.create()
        }
      };
    e.widget.prototype = {
      _innerWindow: function() {
        return e.gEl(this.id).contentWindow
      },
      _autoResizeChart: function() {
        this.options.fullscreen &&
          $(e.gEl(this.id)).css("height", $(window).height() + "px")
      },
      create: function() {
        function a(a) {
          g.load(JSON.parse(a.content), a)
        }

        function b() {
          e.gEl(g.id).contentWindow.Q16.subscribe("chart_load_requested", a)
        }
        var c = this.render(),
          g = this,
          d;
        if (this.options.container) {
          var f = e.gEl(this.options.container);
          f.innerHTML = c
        } else document.write(c);
        if (this.options.autosize || this.options.fullscreen) f = $(e.gEl(this.id)), f.css("width", "100%"), this.options.fullscreen || f.css("height", "100%");
        this._autoResizeChart();
        this._onWindowResize = function(a) {
          g._autoResizeChart()
        };
        window.addEventListener("resize", this._onWindowResize);
        this.unsubscribeFromLoadRequestEvent = function() {
          e.gEl(g.id).contentWindow.Q16.unsubscribe("chart_load_requested", a)
        };
        d = e.gEl(this.id);
        var h = null,
          h = function() {
            e.unbindEvent(d, "load", h);
            d.contentWindow.widgetReady(function() {
              var a;
              g._ready = !0;
              for (a = g._ready_handlers.length; a--;) g._ready_handlers[a].call(g);
              d.contentWindow._initializationFinished();
              var c = e.gEl(g.id).contentWindow;
              if (c.Q16) b();
              else {
                var f = null,
                  f = function() {
                    b();
                    e.unbindEvent(c, "load", f)
                  };
                e.bindEvent(c, "load", f)
              }
            })
          };
        e.bindEvent(d, "load", h)
      },
      render: function() {
        window[this.options.uid] = {
          datafeed: this.options.datafeed,
          overrides: this.options.overrides,
          studiesOverrides: this.options.studiesOverrides,
          disabledFeatures: this.options.disabledFeatures,
          enabledFeatures: this.options.enabledFeatures,
          enabledDrawings: this.options.enabledDrawings,
          disabledDrawings: this.options.disabledDrawings,
          favorites: this.options.favorites,
          logo: this.options.logo,
          numeric_formatting: this.options.numeric_formatting
        };
        this.options.savedData && (window[this.options.uid].chartContent = {
          json: this.options.savedData
        });
        var a = (this.options.path || "") + "static/tv-chart.html#localserver=1&symbol=" + encodeURIComponent(this.options.symbol) + "&interval=" + encodeURIComponent(this.options.interval) + (this.options.toolbar_bg ? "&toolbarbg=" + this.options.toolbar_bg.replace("#", "") : "") + "&hideSymbolSearch=" + this.options.hideSymbolSearch + "&hideSideToolbar=" + this.options.hideSideToolbar +
          "&enabledStudies=" + encodeURIComponent(JSON.stringify(this.options.enabledStudies)) + "&disabledStudies=" + encodeURIComponent(JSON.stringify(this.options.disabledStudies)) + (this.options.studiesAccess ? "&studiesAccess=" + encodeURIComponent(JSON.stringify(this.options.studiesAccess)) : "") + "&widgetbar=" + encodeURIComponent(JSON.stringify(this.options.widgetbar)) + (this.options.drawingsAccess ? "&drawingsAccess=" + encodeURIComponent(JSON.stringify(this.options.drawingsAccess)) : "") + "&timeFrames=" + encodeURIComponent(JSON.stringify(this.options.time_frames)) +
          (this.options.hasOwnProperty("disableLogo") ? "&disableLogo=" + encodeURIComponent(this.options.disableLogo) : "") + "&locale=" + encodeURIComponent(this.options.locale) + "&uid=" + encodeURIComponent(this.options.uid) + "&clientId=" + encodeURIComponent(this.options.client_id) + "&userId=" + encodeURIComponent(this.options.user_id) + (this.options.charts_storage_url ? "&chartsStorageUrl=" + encodeURIComponent(this.options.charts_storage_url) : "") + (this.options.charts_storage_api_version ? "&chartsStorageVer=" + encodeURIComponent(this.options.charts_storage_api_version) :
            "") + (this.options.indicators_file_name ? "&indicatorsFile=" + encodeURIComponent(this.options.indicators_file_name) : "") + (this.options.custom_css_url ? "&customCSS=" + encodeURIComponent(this.options.custom_css_url) : "") + "&debug=" + this.options.debug + (this.options.snapshotUrl ? "&snapshotUrl=" + encodeURIComponent(this.options.snapshotUrl) : "") + (this.options.timezone ? "&timezone=" + encodeURIComponent(this.options.timezone) : "");
        return '<iframe id="' + this.id + '" name="' + this.id + '"  src="' + a + '"' + (this.options.autosize ||
          this.options.fullscreen ? "" : ' width="' + this.options.width + '" height="' + this.options.height + '"') + ' frameborder="0" allowTransparency="true" scrolling="no" allowfullscreen style="display:block;"></iframe>'
      },
      onChartReady: function(a) {
        this._ready ? a.call(this) : this._ready_handlers.push(a)
      },
      setSymbol: function(a, b, c) {
        this._innerWindow().changeSymbol(a, b + "", c)
      },
      executeAction: function(a) {
        this._innerWindow().executeAction(a)
      },
      executeActionById: function(a) {
        this._innerWindow().executeActionById(a)
      },
      removeAllStudies: function() {
        this._innerWindow().removeAllStudies()
      },
      removeAllShapes: function() {
        this._innerWindow().removeAllShapes()
      },
      createStudy: function(a, b, c, e, d, f) {
        this._innerWindow().createStudy({
          name: a,
          lock: c,
          forceOverlay: b,
          inputs: e,
          callback: d,
          overrides: f
        })
      },
      removeEntity: function(a) {
        this._innerWindow().removeEntity(a)
      },
      createShape: function(a, b, c) {
        return this._innerWindow().createShape({
          point: a,
          options: b,
          callback: c
        })
      },
      createMultipointShape: function(a, b, c) {
        return this._innerWindow().createMultipointShape({
          points: a,
          options: b,
          callback: c
        })
      },
      createVerticalLine: function(a,
        b) {
        this.createShape(a, $.extend(b, {
          shape: "vertical_line"
        }))
      },
      createOrderLine: function(a) {
        a = a || {};
        return this._innerWindow().createTradingPrimitive("LineToolOrder", a.disableUndo)
      },
      createPositionLine: function(a) {
        a = a || {};
        return this._innerWindow().createTradingPrimitive("LineToolPosition", a.disableUndo)
      },
      createExecutionShape: function(a) {
        a = a || {};
        return this._innerWindow().createTradingPrimitive("LineToolExecution", a.disableUndo)
      },
      _widgetResizeTimer: null,
      createButton: function(a) {
        var b = this;
        a = a || {};
        var c =
          a.align || "left";
        a = this._innerWindow().headerWidget;
        c = "left" == c ? a._$left : a._$right;
        a = a.createGroup({
          single: !0
        }).appendTo(c);
        a = $('<div class="button"></div>').appendTo(a);
        this._widgetResizeTimer && clearTimeout(this._widgetResizeTimer);
        this._widgetResizeTimer = setTimeout(function() {
          b._innerWindow().resizeWindow();
          clearTimeout(b._widgetResizeTimer)
        }, 5);
        return a
      },
      symbolInterval: function(a) {
        var b = this._innerWindow().getSymbolInterval();
        a && a(b);
        return b
      },
      onSymbolChange: function(a) {
        this._innerWindow().setCallback("onSymbolChange",
          a)
      },
      onIntervalChange: function(a) {
        this._innerWindow().setCallback("onIntervalChange", a)
      },
      onTick: function(a) {
        this._innerWindow().setCallback("onTick", a)
      },
      remove: function() {
        window.removeEventListener("resize", this._onWindowResize);
        delete window[this.options.uid];
        var a = e.gEl(this.id);
        a.contentWindow.destroyChart();
        this.unsubscribeFromLoadRequestEvent();
        a.parentNode.removeChild(a)
      },
      getVisibleRange: function(a) {
        var b = this._innerWindow().getVisibleRange();
        a && a(b);
        return b
      },
      setVisibleRange: function(a, b) {
        this._innerWindow().setVisibleRange(a,
          b)
      },
      onAutoSaveNeeded: function(a) {
        this._innerWindow().setCallback("onAutoSaveNeeded", a)
      },
      onMarkClick: function(a) {
        this._innerWindow().setCallback("onMarkClick", a)
      },
      onBarMarkClicked: function(a) {
        this._innerWindow().setCallback("onMarkClick", a)
      },
      onTimescaleMarkClicked: function(a) {
        this._innerWindow().setCallback("onTimescaleMarkClick", a)
      },
      subscribe: function(a, b) {
        this._innerWindow().setCallback(a, b)
      },
      onScreenshotReady: function(a) {
        this._innerWindow().setCallback("onScreenshotReady", a)
      },
      onContextMenu: function(a) {
        this._innerWindow().Q16.subscribe("onContextMenu",
          function(b) {
            b.callback(a(b.unixtime, b.price))
          })
      },
      onShortcut: function(a, b) {
        this._innerWindow().createShortcutAction(a, b)
      },
      onGrayedObjectClicked: function(a) {
        this._innerWindow().Q16.subscribe("onGrayedObjectClicked", a)
      },
      refreshMarks: function() {
        this._innerWindow().refreshMarks()
      },
      closePopupsAndDialogs: function() {
        this._innerWindow().closePopupsAndDialogs()
      },
      clearMarks: function() {
        this._innerWindow().clearMarks()
      },
      setChartType: function(a) {
        this._innerWindow().setChartType(a)
      },
      createStudyTemplate: function(a, b) {
        var c = this._innerWindow().createStudyTemplate(a);
        b && b(c);
        return c
      },
      applyStudyTemplate: function(a) {
        this._innerWindow().applyStudyTemplate(a)
      },
      addCustomCSSFile: function(a) {
        this._innerWindow().addCustomCSSFile(a)
      },
      save: function(a) {
        this._innerWindow().saveChart(a)
      },
      load: function(a, b) {
        this._innerWindow().loadChart({
          json: a,
          extendedData: b
        })
      },
      setLanguage: function(a) {
        this.remove();
        this.options.locale = a;
        this.create()
      }
    };
    window.TradingView && jQuery ? jQuery.extend(window.TradingView,
      e) : window.TradingView = e
  }
})();
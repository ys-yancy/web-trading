'use strict';

var Core = require('../../../../../app/core');
var numeral = require('../../../../../lib/numeral');
require('../../../../../lib/date');
require('../../../../../lib/stomp-quote-helper');
require('../../../../../lib/stomp');

// require('../../../../../lib/trading-view');
require('../../../../../lib/datafeed-etgbroker');

// var OrderDetail = require('../order-detail');

export default class Chart extends Core {
  constructor(config) {
    super(config);

    // this._requires();

    this._initDate();
    this._initConfig();
    this._initChart();
    this._bind();

    this.lines = [];

    window.createPositionLine = _.bind(this.createPositionLine, this);
  }

  _bind() {
    this.subscribe('change:symbol', this.changeSymbol, this);

    this.subscribe('siwtch:tab', this._resize, this);
  }

  _resize(e) {
    // console.log(this.el.width(),this.el.width() - 288)
    var iframeEl = $('iframe', this.el);
    var sildebarEl = $('.sidebar');
    var sildeBarContentEl = $('#J_Option', sildebarEl);
    if (e.open) {
      // var width = this.el.width() - 288
      var width = this.el.width() - sildeBarContentEl.width();

      this.el.width(width);
      iframeEl.width(width);
    } else {
      this.el.width('auto');
      iframeEl.width('100%');
    }
  }

  _initDate() {
    timezoneJS.timezone.zoneFileBasePath = 'tz';
    timezoneJS.timezone.init({
      callback: function() {
        var dt = new timezoneJS.Date(2006, 9, 29, 1, 59, 'America/Los_Angeles');
        dt.getTimezoneOffset();
        // console.log("dt.getTimezoneOffset() = " + dt.getTimezoneOffset());
        // Post-DST-leap
        var dt = new timezoneJS.Date(2006, 9, 29, 2, 0, 'America/Los_Angeles');
        dt.getTimezoneOffset();
        // console.log("dt.getTimezoneOffset() = " + dt.getTimezoneOffset());
      }
    });
  }

  _initConfig() {
    var widget = null;

    // 生产环境的配置

    var datafeed = new Datafeeds.UDFCompatibleDatafeed(getUDFCompatibleDatafeedUrl());
    Cookie.get('group_name')&&datafeed.set_groupname(Cookie.get('group_name'));
    datafeed.stompHelper = new QuoteHelper(getQuoteHelperUrl());

    var login = "gooduser";
    var passcode = "passwd1";
    var host = "localhost";

    datafeed.stompHelper.connect(login, passcode,
      function() {
        console.log("stomp connected");
      },
      function(error) {
        console.log(error);
      },
      host);

    this.datafeed = datafeed;

  }

  _initChart() {
    var chartStorageUrl = location.host.indexOf('test.etgbroker.com') !== -1 || location.host.indexOf('localhost') !== -1 ? 'http://waibao.invhero.com:8100/v1/advchart' : getChartStorageUrl();
    TradingView.onready(() => {
       var widget = this.widget = new TradingView.widget({
        fullscreen: false,
        timezone: "Asia/Shanghai",
        //width: '90%',
        height: '100%',
        width: '100%', //"" + window.innerWidth - 100 +
        symbol: 'EURUSD',
        ticker: 'EURUSD',
        interval: '60',
        container_id: this.el[0].id,
        //  BEWARE: no trailing slash is expected in feed URL
        //datafeed: new Datafeeds.UDFCompatibleDatafeed("http://localhost:8099/tradingview"),
        datafeed: this.datafeed,
        library_path: "charting_library/",
        locale: "zh",
        //  Regression Trend-related functionality is not implemented yet, so it's hidden for a while
        drawings_access: {
          type: 'black',
          tools: [{
            name: "Regression Trend"
          }]
        },
        disabled_features: ["use_localstorage_for_settings", "header_screenshot", "timeframes_toolbar", "header_symbol_search"],

        //enabled_features: ["study_templates", "header_widget", "left_toolbar"],
        // disabled_features: ["header_widget", "left_toolbar"],
        // preset: "mobile",
        overrides: getOutlookParams(),

        charts_storage_url: chartStorageUrl,
        client_id: '0',
        user_id: Cookie.get('token'),
        charts_storage_api_version: '1.1'
      });

      
      widget.onChartReady(function() {

        addDefault(widget);

        
        // widget.onContextMenu(function(unixtime, price) {

        //   return [
            
        //     {
        //       position: "top",
        //       text: "First top menu item, time: " + unixtime + ", price: " + price,
        //       click: function() {
        //         alert("First clicked.");
        //       }
        //     }, {
        //       text: "-",
        //       position: "top"
        //     }, {
        //       text: "-Objects Tree..."
        //     }, {
        //       position: "top",
        //       text: "Second top menu item 2",
        //       click: function() {
        //         alert("Second clicked.");
        //       }
        //     }, {
        //       position: "bottom",
        //       text: "Bottom menu item",
        //       click: function() {
        //         alert("Third clicked.");
        //       }
        //     }
        //   ];

        // });
        

        window.widget = widget;

        // widget.createButton()
        //   .attr('title', "My custom button tooltip")
        //   .on('click', function(e) {
        //     alert("My custom button pressed!");
        //   })
        //   .append($('<span>入金</span>'));

      });
    });
  }

  changeSymbol(data) {
    var symbol = data.symbol;
    this.order = data.order || {};
    this.close = data.close;
    this.lines.forEach((line) => {
      try {
        line.remove();
      } catch (e) {

      }
    });

    this.lines.length = 0;

    try {
      var symbolInterval = this.widget.symbolInterval();
      var old_symbol = symbolInterval.symbol && symbolInterval.symbol.replace(/^:/, '');
      var resolution = symbolInterval.interval;
      this.widget.setSymbol(symbol, resolution, null);
    } catch (e) {
      console.log(e);
    }

    // this.orderDetail.update(data);
  }

  // 设置止损线
  setStoplossLine(stoploss) {
    var text = '止损：';
    var self = this;

    var oline = this.widget.createOrderLine()
      .onMove(function(text) {
        var price = this.getPrice();
        // this.setText(text + price);

        self.fire('update:stoploss', { price: price, ticket: self.order.ticket, close: self.close });
        // this.setText(text + price);
      })
      .onModify("onModify called", function(text) {
        // this.setText(text + );
        console.log(price + 'update')
      })
      .onCancel("onCancel called", function(text) {
        // this.setText(text);
        self.fire('remove:stoploss', { ticket: self.order.ticket, close: self.close });
      })
      .setText(text + stoploss)
      .setPrice(stoploss)
      .setLineColor('#19b544')
      .setBodyBorderColor('#19b544')
      .setBodyTextColor('#19b544')
      .setBodyBackgroundColor('rgba(0,0,0,0)')
      .setCancelButtonBorderColor('#19b544')
      .setCancelButtonBackgroundColor('#19b544')
      .setCancelButtonIconColor('#fff')
      .setQuantity(null)
      .setLineLength(30);

    window.oline = oline;
    this.lines.push(oline);
    return oline;


  }

  // 设置止盈线
  setTakeprofitLine(takeprofit) {
    var text = '止盈：';
    var self = this;

    var oline = this.widget.createOrderLine()
      .onMove(function(text) {
        var price = this.getPrice();

        self.fire('update:takeprofit', { price: price, ticket: self.order.ticket, close: self.close });
        // this.setText(text + price);
      })
      .onModify("onModify called", function(text) {
        this.setText(text);
      })
      .onCancel("onCancel called", function(text) {
        // this.setText(text);
        self.fire('remove:takeprofit', { ticket: self.order.ticket, close: self.close });
      })
      .setText(text + takeprofit)
      .setPrice(takeprofit)
      .setLineColor('#de4947')
      .setBodyBorderColor('#de4947')
      .setBodyTextColor('#de4947')
      .setBodyBackgroundColor('rgba(0,0,0,0)')
      .setCancelButtonBorderColor('#de4947')
      .setCancelButtonBackgroundColor('#de4947')
      .setCancelButtonIconColor('#fff')
      .setQuantity(null)
      .setLineLength(30);

    this.lines.push(oline);


    return oline;
  }

  // 设置盈利线
  setProfitLine(closePrice, profit) {
    closePrice = parseFloat(closePrice).toFixed(2);
    profit = parseFloat(profit).toFixed(2);
    var oline = this.widget.createPositionLine()
      .setText('平仓：' + closePrice + '  利润：' + profit)
      .setPrice(closePrice)
      .setLineColor('#cccccc')
      .setBodyBorderColor('#cccccc')
      .setBodyTextColor('#666')
      .setBodyBackgroundColor('rgba(255,255,255,.9)')
      .setQuantity(null)
      .setLineLength(40);

    this.lines.push(oline);

    return oline;
  }

  // 设置历史订单开仓线
  setOpenLine(openPrice) {
    openPrice = parseFloat(openPrice).toFixed(2);
    var oline = this.widget.createPositionLine()
    .setText('开仓价格：' + openPrice )
    .setPrice(openPrice)
    .setLineColor('#0CB5E6')
    .setBodyBorderColor('#3AB8E6')
    .setBodyTextColor('#fff')
    .setBodyBackgroundColor('rgba(58,184,230,.9)')
    .setQuantity(null)
    .setLineLength(25);

    this.lines.push(oline);

    return oline;
  }

  setOrderLine(openPrice, close, profit, up) {
    var self = this;
    var oline = this.widget.createPositionLine()
      .onModify(function() {
        // this.setText("onModify called");
        self.fire('double:order', { ticket: self.order.ticket, close: self.close });
      })
      .onReverse("onReverse called", function(text) {
        // this.setText(text);
        self.fire('reverse:order', { ticket: self.order.ticket, close: self.close });
      })
      .onClose("onClose called", function(text) {
        oline.remove();
        self.fire('close:order', { close: self.close });
      })
      // .setText("开仓：" + openPrice)
      .setText(profit)
      .setPrice(openPrice)
      .setLineColor('#0cb5e6')
      .setBodyBorderColor('#0cb5e6')
      .setBodyTextColor('#0cb5e6')
      .setBodyBackgroundColor('rgba(0,0,0,0)')
      .setCloseButtonBackgroundColor('#0ea6d2')
      .setCloseButtonIconColor('#FFF')
      .setQuantity("x2")
      .setQuantityTextColor('#fff')
      .setQuantityBorderColor('#0ea6d2')
      .setQuantityBackgroundColor('#0ea6d2')
      .setReverseButtonIconColor('#fff')
      .setReverseButtonBorderColor('#0ea6d2')
      .setReverseButtonBackgroundColor('#0ea6d2')
      .setLineLength(40)

    this.lines.push(oline);

    if (close) {
      oline.setCloseButtonBackgroundColor('#ccc');
      oline.setQuantityBorderColor('#ccc');
      oline.setQuantityBackgroundColor('#ccc');
      oline.setReverseButtonBackgroundColor('#ccc');
      oline.setReverseButtonBorderColor('#ccc');
    }

    this.setOrderLineColor(oline, up);

    return oline;
  }

  setOrderLineColor(line, up) {
    var color = up ? '#D75442' : '#6BA583';

    line.setLineColor(color)
      .setBodyBorderColor(color)
      .setBodyTextColor(color)
      .setCloseButtonBorderColor(color)
      .setQuantityBorderColor(color)
      .setQuantityBackgroundColor(color)
      .setReverseButtonBorderColor(color)
      .setReverseButtonBackgroundColor(color)
      .setCloseButtonBackgroundColor(color)

    // line.setCancelButtonBorderColor(color)
    // 
  }

  createPositionLine() {
    var line = this.widget.createPositionLine();

    line.onModify(function() {
        this.setText("onModify called");
      })
      .onReverse("onReverse called", function(text) {
        this.setText(text);
      })
      .onClose("onClose called", function(text) {
        this.setText(text);
        line.remove();
      })
      .setText("PROFIT: 71.1 (3.31%)")
      .setQuantity("8.235")
      .setPrice(1.15)
      .setExtendLeft(false)
      .setLineStyle(0)
      .setLineLength(25);

    var oline = this.widget.createOrderLine()
      .onMove(function() {
        this.setText("onMove called " + this.getPrice());
      })
      .onModify("onModify called", function(text) {
        this.setText(text);
      })
      .onCancel("onCancel called", function(text) {
        this.setText(text);
      })
      .setText("STOP: 73.5 (5,64%)")
      .setQuantity("2")
      .setPrice(1.09)
      .setLineColor('#19b544')
      .setBodyBorderColor('#19b544')
      .setBodyTextColor('#19b544')
      .setBodyBackgroundColor('rgba(0,0,0,0)')
      .setCancelButtonBorderColor('#19b544')
      .setCancelButtonBackgroundColor('#19b544')
      .setCancelButtonIconColor('#fff')
      .setQuantity(null);


    var shape = this.widget.createExecutionShape()
      .setText("@1,320.75 Limit Buy 1")
      .setTooltip("@1,320.75 Limit Buy 1")
      .setTextColor("rgba(0,255,0,0.5)")
      .setArrowColor("#0F0")
      .setDirection("buy")
      .setTime(1452851600000)
      .setPrice(1.08);

    // var sp = this.widget.createShape({ time: 1452851600000, price: 1.14 }, {
    //   shape: 'flag',
    //   text: 'arrow_up',
    //   lock: false
    // })
  }

  setResolution(order) {
    this.widget.chart().setResolution('D');  
  }

  // stoplossLine(val) {
  //   var line = this.widget.createPositionLine();
  //   line.onModify(function() {
  //       this.setText("onModify called");
  //     })
  //     .onReverse("onReverse called", function(text) {
  //       this.setText(text);
  //     })
  //     .onClose("onClose called", function(text) {
  //       this.setText(text);
  //       line.remove();
  //     })
  //     .setText(val)
  //     .setQuantity("8.235")
  //     .setPrice(1.15)
  //     .setExtendLeft(false)
  //     .setLineStyle(0)
  //     .setLineLength(25);
  // }

  // _requires() {
  //   this.orderDetail = new OrderDetail({ containerEl: this.el });
  // }
}
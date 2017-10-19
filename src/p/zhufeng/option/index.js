'use strict';


var Base = require('../../../app/base');
var Uri = require('../../../app/uri');
var Config = require('../../../app/config');
// var Pagination = require('../../../common/pagination');
var ZHeader = require('../../../common/zHeader');
var tmpl = require('./index.ejs.html');

class Option extends Base {
  constructor() {
    super();

    this._initAttrs();

    var symbolType = new Uri().getParam('symbolType');

    this._switch(symbolType);
    this._bind();
  }

  _switch(index) {
    var characterEls = $('.character');
    var index = index || 0;

    if (index && index > 0) {
      $(characterEls[0]).hide();
      $(characterEls[1]).show();

      $('.advantage').hide();
    } else {
      $(characterEls[0]).show();
      $(characterEls[1]).hide();

      $('.advantage').show();
    }

    this.index = index;

    if (index === 3 || index === 4) {
      $('#J_List').html('');
      this._getComplex(this.categorys[this.index].split(','))


      return;
    }

    this._getData(this.categorys[index]);
  }

  _getComplex(categorys, index, count, page) {
    if (categorys) {
      this.categorylist = categorys;
      this.cateIndex = index;

    } else {
      categorys = this.categorylist;
      index = this.cateIndex || 0;
      page = this.page;
    }

    index = index || 0;
    count = count || 10;
    page = page || 1;
    this.page = page;

    this.ajax({
      url: '/v3/real/symbols4/',
      data: {
        access_token: Config.getToken(),
        category: categorys[index],
        start: (page - 1) * count,
        count: count
      }
    }).then((data) => {
      var list = data.data;

      var len = data.data.length;

      list.forEach((item) => {
        item.tradetime = Config.getTradeTime(item.policy.symbol, item.policy.category);
      });

      this.renderTo(tmpl, list, $('#J_List'));
      this._odd();

      if (len !== count) {
        if (index === categorys.length - 1) {
          $('.load-more').addClass('no');
        } else {
          var trLen = $('tr', '#J_List').length;
          var need = 10 - trLen % 10;

          this._getComplex(categorys, ++index, need, 1)
        }
      } else {
        this.page++;
        $('.load-more').removeClass('no');
      }
    });
  }

  _odd() {
    $('tr', $('#J_List')).removeClass('odd');
    $("tr:odd", $('#J_List')).addClass('odd');
  }

  _bind() {
    var doc = $(document);

    this.subscribe('switch:symbol', (e) => {
      this._switch(e.index);

      window.scrollTo(0, 0);//$('.list-inner').offset().top - 50);
    });

    $('form').on('submit', (e) => {
      var val = $('.ipt').val();
      e.preventDefault();

      // if (val) {
      this._search(val);
      // }
    });

    $(window).on('scroll', $.proxy(this._scroll, this));

    doc.on('click', '.J_More', $.proxy(this._more, this));
    doc.on('click', '#J_GoTop', () => {
      window.scrollTo(0, 0);
    })
  }

  _more() {
    var page;
    if (this.page && this.index < 3) {
      page = ++this.page;
    } else {
      this.page = 2;
      page = 2;
    }

    console.log('加载下一页')

    if (this.index === 3 || this.index === 4) {
      this._getComplex();
      return;
    }

    this._getData(undefined, page);
  }

  _scroll() {
    var win = $(window);
    var tbEl = $('#J_TBInner');
    var goTopEl = $('#J_GoTop');
    // var tbElHeight = tbEl.height();

    var offsetTop = tbEl.offset().top;
    var winHeight = win.height();
    var scrollOffset = win.scrollTop();

    if (scrollOffset + winHeight - offsetTop > 0) {
      goTopEl.show();
    } else {
      goTopEl.hide();
    }
  }

  _search(val) {
    if (val) {
      val = val.toUpperCase();
      this._getData(undefined, undefined, val);
    } else {
      this._getData();
    }
  }

  /**
   * 美股对应category：STOCK_US
   * 外汇对应category：FOREX
   * 石油对应category：OIL
   * 金属对应category：METAL_GOLD 和 METAL_SILVER
   * 股指对应category：STOCK_INDEX
   */
  _getData(category, page, keyword) {
    if (!category) {
      this.page = page;
    } else {
      this.page = 1;
    }

    if (category) {
      this.category = category;
    } else {
      category = this.category;
    }
    var params = {
      access_token: Config.getToken()
    };

    if (keyword) {
      params.symbols = keyword;
    } else {
      params.category = category;
    }

    if (page !== undefined) {
      params.count = 10;
      params.start = page === 1 ? 0 : (page - 1) * 10;
    } else {
      params.count = 10;
    }

    this.ajax({
      url: '/v3/demo/symbols4/',
      data: params
    }).then((data) => {

      if (data.data.length < 10) {
        $('.load-more').addClass('no');
      } else {
        $('.load-more').removeClass('no');
      }

      if (data.data.length === 0) {
        if (keyword) {
          $('#empty').show();
          $('table').hide();
          $('.load-more').hide();
        }
        return;
      }

      $('#empty').hide();
      $('table').show();
      $('.load-more').show();

      data.data.forEach((item) => {
        item.tradetime = Config.getTradeTime(item.policy.symbol, item.policy.category);
      });

      if (page === undefined) {
        this.render(tmpl, data.data, $('#J_List'));
      } else {
        this.renderTo(tmpl, data.data, $('#J_List'));
      }
      this._odd();

      $('table').show();
    }).catch((e) => {
      console.log(e);
    })
  }

  _initPage(page) {
    // this.pager && this.pager.destroy();
    // var pageEl = $('#J_Page');

    // if (page === 0) {
    //   pageEl.hide();
    // } else {
    //   pageEl.show();
    // }

    // this.pager = pageEl.pagination({
    //   items: page,
    //   itemsOnPage: 1,
    //   cssStyle: 'light-theme',
    //   prevText: '&#xe602;',
    //   nextText: '&#xe601;',
    //   onPageClick: (page) => {
    //     this._getData(this.categroy, page);
    //   }
    // });
  }

  _initAttrs() {
    this.categorys = [
      'STOCK_US',
      'FOREX',
      'OIL',
      'METAL_GOLD,METAL_SILVER,METAL_GOLD_MINI,METAL_SILVER_MINI',
      'INDEX_GLOBAL,FUTURE_HKEX,FUTURE_ICE,FUTURE_COMEX,FUTURE_GLOBAL_SGX_MINI,FUTURE_US'
    ];

    this.openTime = {
      STOCK_US: 'PM22:30-AM5:00',
      FOREX: 'PM22:30-AM5:00',
      OIL: 'PM22:30-AM5:00',
      METAL_GOLD: 'PM22:30-AM5:00',
      METAL_SILVER: 'PM22:30-AM5:00',
      STOCK_INDEX: 'PM22:30-AM5:00',
      'AA.NYSE': 'PM22:30-AM5:00' // 特殊品种
    }
  }
}

new Option();
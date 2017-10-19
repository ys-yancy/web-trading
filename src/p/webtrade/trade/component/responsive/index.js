'use strict';

require('./index.css');
var Base = require('../../../../../app/base');
var win = $(window);

export default class Responsive extends Base {
  constructor(config) {
    super(config);

    this._initAttrs();
    this._setHeight();
    this._setWidth();
    this._bind();
  }

  _bind() {
    win.on('resize', _.bind(this._resize, this));

    var bodyEl = $('body');

    $(document).on('click', '.J_TriggerTab', (e) => {
      $('.tab-nav.active', $('#J_SidebarInner')).trigger('click');
    }).on('click', '.J_MoreDetail', (e) => {
      var curEl = $(e.currentTarget);

      if (bodyEl.hasClass('show-more')) {
        curEl.text('显示更多');
        this.broadcast('set:overlayPosition', true);
      } else {
        curEl.text('收回');
        this.broadcast('set:overlayPosition');
      }

      bodyEl.toggleClass('show-more');
    });
  }

  _resize() {
    this._setWidth();
    this._setHeight();

    this.broadcast('resize:window');
  }

  _setWidth() {
    var winWidth = $(window).width();
    var minWidth = 1080;
    // var marginWidth = 20;
    var marginWidth = 2;

    var contentOuterEl = $('.content-outer');
    var mainEl = $('.main');
    var sidebarEl = $('.sidebar');
    var tabContentEl = $('.tab-content', sidebarEl);
    var headerAccountEl = $('.account-wrapper');
    var bodyEl = $('body');

    if (winWidth < 1350) {
      if (winWidth > 1080) {
        this.isFullScreen() && tabContentEl.removeClass('show').hide();
        bodyEl.addClass('min').removeClass('w-750 w-990 max');
        contentOuterEl.width(1062);
      } else if (winWidth >= 990) {

        bodyEl.addClass('w-990').removeClass('min w-750 max');

      } else {

        bodyEl.addClass('w-750').removeClass('min w-990 max');
        if (winWidth < 750) {
          winWidth = 750;
        }
      }
    } else {
      $('body').removeClass('min w-750 w-990');
      this.broadcast('show:sidebar');
      $('.trigger-wrapper').hide();

    }

    var sidebarWidth = sidebarEl.width();
    var mainWidth = winWidth - marginWidth - sidebarWidth;
    contentOuterEl.width(winWidth - marginWidth);
    mainEl.width(mainWidth);
    headerAccountEl.width(mainWidth)
    sidebarEl.css({
      'margin-left': mainWidth
    });

    $('.J_ResponsiveMargin').css({
      'width': (mainWidth - 1018) / 4,
      float: 'left',
      height: 1
    });

    if (winWidth > 1350 && mainWidth < 1380) {
      bodyEl.addClass("max");
    } else {
      bodyEl.removeClass("max");
    }

  }

  _setHeight() {
    var winHeight = win.height();
    var headerHeight = $('header').height();
    var chart_height = winHeight - this.orderTabEl.height() - headerHeight - 16;
    var chart_attr_height = winHeight - this.orderTabInitHeight - headerHeight - 16;

    $('.sidebar').height(winHeight - headerHeight - 6);
    $('.tab-content', '.sidebar').height(winHeight - headerHeight - 6); // 多减去padding的长度
    $('#J_Chart').height(chart_height).attr('data-height', chart_attr_height);

    // 品种需要单独适配
    $('.bd', '#J_Option').height(winHeight - headerHeight - 52);

  }

  removeCreateOrder() {
    // var CreateOrderEl = $('#J_CreateOrder');
    // this.isFullScreen() && CreateOrderEl.length > = && CreateOrderEl.remove();
  }

  isFullScreen() {
    var bodyClass = $('body').attr('class');
    if( !bodyClass || bodyClass === 'max' ) {
      return true;
    } else {
      return false;
    }
    
  }

  _initAttrs() {
    this.orderTabEl = $('#J_OrderTab');
    this.orderTabInitHeight = this.orderTabEl.height() || 42;
  }
}
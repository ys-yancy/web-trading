'use strict';

var Base = require('../../../../../app/base');

export default class Tab extends Base {
  constructor(config) {
    super(config);

    this._bind();
    this._resetPositon();
  }

  _bind() {
    this.el.on('click', '.tab-nav', _.bind(this._switch, this));
    this.el.on('click', '.J_MorewidthTab', _.bind(this._setMoreWidth, this))
    this.subscribe('show:sidebar', _.bind(this._showSidebar, this));
    this.subscribe('show:sidebar:ticket', this._showSidebarTicket, this);
  }

  _showSidebar(e) {
    if (this.responsive) {
      // 这有 问题
      $('.tab-nav.active', this.el).trigger('click');
    }
  }

  _showSidebarTicket() {
    var isFullScreen = this.isFullScreen();
    if( isFullScreen ) {
      $('.ticket', this.el).trigger('click');  
    }
  }

  _switch(e) {
    var curEl = $(e.currentTarget);
    var index = curEl.index();
    var curParentEl = curEl.parents("#J_OrderTab");
    var contentEls = $('.tab-content', this.el);
    var ticketEl = $('.ticket', this.el);
    var tabEl = $('.J_TriggerTab');
    var chartEl = $("#J_Chart");

    if (this.responsive) {
      tabEl.hide();
    }

    if ( !curEl.hasClass('ticket') ) {
      ticketEl.hide();  
    } else {
      ticketEl.show();  
    }

    // curEl.siblings('.tab-nav').removeClass('active');
    // curEl.addClass('active');

    if (this.responsive && curEl.hasClass('active')) {
      var curContentEl = $(contentEls[index]);
      if ($('body').width() < 1350) {

        var open = false;

        if (curContentEl.hasClass('show')) {

          curContentEl.removeClass('show').hide();

        } else {
          // contentEls.removeClass('show').hide();
          curContentEl.addClass('show').show();
          open = true
          tabEl.show();
        }
        // 展开之前回复原来状态
        // this.listenOpen && this.broadcast('siwtch:tab', { open: false });
        this.listenOpen && this.broadcast('siwtch:tab', { open: open })
      } else {
        tabEl.hide();
        curContentEl.show();
        this.listenOpen && this.broadcast('siwtch:tab', { open: false });
      }
      return;
    }

    if (this.responsive) {
      if ($(window).width() <= 1350) {
        if (!curEl.hasClass('active')) {
          tabEl.show();
        }
      } else {
        tabEl.hide();
      }
    }

    if(curParentEl.hasClass("hidden")){

      curParentEl.removeClass("hidden").height(405);
      chartEl.height(chartEl.height() - this._getMinHeight());

    } else {
      if( curEl.hasClass("active") ){
        var oldChartHeight = chartEl.attr('data-height');
        curParentEl.addClass("hidden").height(32);
        chartEl.height(oldChartHeight); 
      }
    }

    if(this.responsive) {
      this.broadcast('update:modules', curEl);
    }

    curEl.siblings('.tab-nav').removeClass('active');
    curEl.addClass('active');
    contentEls.hide();
    $(contentEls[index]).addClass('show').show();

    if (this.responsive && index == 3) {
      this.broadcast('calendar:scrollTop', curEl);
    } 
  }

  _getMinHeight() {
    var orderTabEl = $("#J_OrderTab");
    var orderTabElOuterHeight = orderTabEl.outerHeight(true);
    var tradeHdElOuterHeight = $('.trade-hd', orderTabEl).outerHeight(true); 
    return orderTabElOuterHeight - tradeHdElOuterHeight - 10;
  }

  _setMoreWidth(e) {
    var minWidth = 100;
   
    var mainEl = $('.main'),
        sidebarEl = $('.sidebar'),
        tabContentWrapperEl = $('.tab-content-wrapper', sidebarEl),
        tabContentEl = $('.tab-content', tabContentWrapperEl),
        contentSymbolEl = $('.symbols', tabContentWrapperEl),
        categoryEl = $('#J_Category');

    var isMore = this.el.hasClass('more-width');
    var _width = tabContentWrapperEl.width();

    if ( !isMore ) {
      minWidth *= -1;
      this.el.addClass('more-width');
      sidebarEl.addClass('setMoreWidth');
      categoryEl && categoryEl.addClass('max-width').width(500);
    } else {
      minWidth *= 1;
      this.el.removeClass('more-width');
      sidebarEl.removeClass('setMoreWidth');
      categoryEl && categoryEl.removeClass('max-width').width(400);
    } 
    mainEl.width(mainEl.width() + minWidth);
    sidebarEl.width(_width - minWidth + 51);
    tabContentWrapperEl.width(_width - minWidth);
    tabContentEl.width(_width - minWidth);
    contentSymbolEl.width(_width - minWidth); 
  }

  isFullScreen() {
    var bodyClass = $('body').attr('class');
    if( !bodyClass || bodyClass === 'max' ) {
      return true;
    } else {
      return false;
    }
    
  }

  _resetPositon() {
    $('.trade-wrapper').css('position', 'static');
  }
  
}
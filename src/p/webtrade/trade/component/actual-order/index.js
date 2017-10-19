/**
 * @ 实时订单
 */
'use strict';
require('./index.css');
var Core = require('../../../../../app/core');
var App = require('../../../../../app');
var Util = require('../../../../../app/util');
var Config = require('../../../../../app/config');
var Overlay = require('../../../../../common/overlay');
var PollingLoad = require('../../../../../common/polling-load');
var CreateOrder = require('../create-order');
var FollowOrder = require('../follow-order');
var tmpl = require('./index.ejs.html');
var listTmpl = require('./list.ejs.html');
var filterTmpl = require('./tmpl/filter.ejs.html');

class ActualOrder extends Core {
	constructor(config) {
		super(config);

		this.curId;
		this.init();		
	}

	init() {
		this._bind();
		this._initAttrs();
		this._responsive();
		this._initPollingLoad();
	}

	_bind() {
		// 显示隐藏选项条
		this.el.on('click', '.J_Trigger', _.bind(this._toggleFilter, this));
    	this.el.on('mouseleave', '.J_Trigger', _.bind(this._hideFilter, this));
    	this.el.on('click', '.J_Item', _.bind(this._switch, this));

    	// 显示隐藏筛选
    	this.el.on('click', '.J_SymbolFilter', _.bind(this._toggleSymbolFilter, this));
    	this.el.on('click', '.J_FilterAction', _.bind(this._filtedSubmit, this));

    	// 取消和全选
    	this.el.on('click', '.J_Choose', _.bind(this._chooseSymbol, this));
    	this.el.on('click', '.J_Cancel', _.bind(this._cancelSymobl, this));

    	// 创建订单
    	this.el.on('click', '.J_SymbolItem', (e) => {
    		var curEl = $(e.currentTarget);
    		var targetEl = $(e.toElement || e.relatedTarget || e.target);

    		e.stopPropagation();

    		// if (targetEl.hasClass('J_Name')) {
    		// 	return;
    		// }

      		this.createOrder && this.createOrder.destroy();

      		this.overlay && this.overlay.show(curEl, true);
      		curEl.addClass('show');

    		this._showOrder(curEl);
    	});

    	// 详情
    	// this.el.on('click', '.J_Name', (e) => {
    	// 	var curEl = $(e.target),
    	// 		referEl = curEl.parents('.J_SymbolItem');

    	// 	this._showFollowOrder(referEl);
    	// })
	}

	_toggleFilter(e) {
    	this.triggerEl.toggleClass('active');
  	}

  	_hideFilter(e) {
  	  this.triggerEl.removeClass('active');
  	}

  	_toggleSymbolFilter(e) {
  		var curEl = $(e.target);
  		var symbolFilterWrapEl = $('.J_SymbolFilterWrap', this.el);
  		if (!this.symbolFilterRenderTo) {
  			this.render(filterTmpl, {}, symbolFilterWrapEl);
  			this.symbolFilterRenderTo = true;
  		}

  		if (curEl.hasClass('active')) {
  			curEl.removeClass('active');
  			symbolFilterWrapEl.removeClass('show').hide();
  			return
  		}

  		curEl.addClass('active');
  		symbolFilterWrapEl.addClass('show').show();
  		return;
  	}

  	_hideSymbolFilter() {
  		var curEl = $('.J_SymbolFilter', this.el);
  		var symbolFilterWrapEl = $('.J_SymbolFilterWrap', this.el);

  		curEl.removeClass('active');
  		symbolFilterWrapEl.removeClass('show').hide();
  	}

  	_chooseSymbol() {
  		var chooseEls = $('.J_CheckSymbol', this.el);
  		chooseEls.prop('checked', true);
  	}

  	_cancelSymobl() {
  		var cancelEls = $('.J_CheckSymbol', this.el);
  		cancelEls.prop('checked', false);
  	}

  	_switch(e) {
	    var curEl = $(e.currentTarget),
	      	index = curEl.index();
	    this.curIndex = index;

	    if (!curEl.hasClass('active')) {
	      	curEl.siblings().removeClass('active');
	      	curEl.addClass('active');

	      	$('.cureent', this.el).text(curEl.text());    
	    }

	    var params = this._getParams();

	    this.polling_load.setParams(params).getData();

	}

	_filtedSubmit() {
		var params = this._getParams();

		this.polling_load.setParams(params).getData();
		this._hideSymbolFilter();

	}

	_initPollingLoad() {
		this.polling_load = new PollingLoad({
			requestUrl: '/v1/order/latest/order/',
			params: this._getParams(),
			isUnjoin: false,
			successCallback: this.getDataSuccessCalback,
			errorCallback: this.getDataErrorCalback,
			setIntervalTime: Config.getActualOrderUpdateTime(),
			scope: this
		});
	}

	getDataSuccessCalback(data) {
		var list, firstItem;
		var now_date = Date.now();
		var baseTime = Config.getActualOrderBaseTime();

		if (!$.isArray(data)) {
			return;
		}

		list = data.map((item) => {
			var item_time = Util.getTime(item.openTime);
			var minTime = now_date - item_time;
			if (minTime > this.base1DTime.time) {
				item.isShowDesc = this.base1DTime.desc;
			} 
			else if ( minTime > this.base5HTime.time ) {
				item.isShowDesc = this.base5HTime.desc;
			} 
			else if (minTime > this.base60Time.time){
				item.isShowDesc = this.base60Time.desc;
			} 
			else if(minTime > this.base30Time.time){
				item.isShowDesc = this.base30Time.desc;
			} 
			else if(minTime > this.base15Time.time) {
				item.isShowDesc = this.base15Time.desc;
			} 
			else if(minTime > this.base5Time.time) {
				item.isShowDesc = this.base5Time.desc;
			} 
			else if (minTime > baseTime) {
				item.isShowDesc = '刚刚';			
			} 
			else {
				item.isShowDesc = false;
			}

			item.avatar = item.avatar ? Config.getAvatarPrefix(item.avatar) : getDefaultAvatarUrl();

			return item;
		});

		firstItem = list[0];


		if (firstItem && firstItem.isShowNow && this.curId != firstItem.id) {
			this.curId = firstItem.id;
			firstItem.isNowRender = true;
			setTimeout(() => {
				('.J_SymbolItem.now', this.el).removeClass('now');
			}, 2000)
		}
		
		this.render(listTmpl, {data: list}, this.listWrapEl);

		this._initOverlay();

	}

	getDataErrorCalback(err) {
		console.log(err)
	}

	destroy() {
		this.polling_load.destroy();
	}

	rebuild() {
		this.polling_load.rebuild();
	}

	_showOrder(curEl) {
		var symbol = curEl.attr('data-symbol');
		symbol = symbol.replace(/-/g, '.');
		this._getSymbol(symbol).then((symbolValue) => {
			// 简单的容错处理
			if (!symbolValue) {
				this.overlay && this.overlay.hide();
			    this.createOrder && this.createOrder._resetTranslateScroll();
			    $('.bd', this.el).removeClass('hidden');
			    $('.J_SymbolItem', this.el).removeClass('show');
			    return
			}
			
			this.broadcast('change:symbol', {
		      	symbol: symbolValue.policy.symbol
		    });

	    	this.createOrder = new CreateOrder({
			    referEl: curEl,
			    symbolValue: _.clone(symbolValue),
			    enable: !symbolValue.tag,
			    rate: symbolValue.rate,
			    rateVal: symbolValue.rateVal,
			    parent: this
			}).on('refresh', (e) => {
			    curEl.trigger('click');
			}).on('destroy', (e) => {
			    this.overlay && this.overlay.hide();
			    this.createOrder && this.createOrder._resetTranslateScroll();
			    $('.bd', this.el).removeClass('hidden');
			    $('.J_SymbolItem', this.el).removeClass('show');
			});

			$('.bd', this.el).addClass('hidden');

		})
	}

	_showFollowOrder(referEl) {
		this.followOrder = new FollowOrder({
			referEl: referEl
		}).on('refresh', (data) => {
			console.log('refresh');
		}).on('destroy', (data) => {
			console.log('destroy');
		})
	}

	_initOverlay() {
		this.overlay = new Overlay({
			parentEl: $('.J_List', this.el)
		})
	}

	_getSymbol(symbol) {
		var option_component = App.get('option');
		var symbolValue = option_component._getSymbol(symbol);
		return new Promise((resolve, reject) => {
			if ( symbolValue ) {
				resolve(symbolValue);
				return;
			}
			
			if ( typeof symbol == 'string' ) {
				symbol = [symbol];
			}
			this.getOption(symbol).then((symbol) => {
				symbol = this._getSymbolObj(symbol);
				resolve(symbol);
				return;
			})

		})
		
	}

	_getSymbolObj(symbol) {
		var symbolVal;
		if ( $.isArray(symbol) ) {
			symbolVal = symbol[0];
		}

		try{

			var bidPrice = symbolVal.quote.bid_price[0],
				askPrice = symbolVal.quote.ask_price[0];

		    var curPrice = (parseFloat(bidPrice) + parseFloat(askPrice)) / 2
		    var rate = curPrice - symbolVal.close_price > 0 ? true : false;
		    var rateVal = curPrice - symbolVal.close_price;
		    var ratePercent = rateVal / symbolVal.close_price;
		    ratePercent = isNaN(ratePercent) ? '--' : (ratePercent.toFixed(5) * 100).toFixed(3);


		    symbolVal.up = rate;
	        symbolVal.rate = ratePercent;
	        symbolVal.rateVal = isNaN(rateVal) ? '--' : rateVal.toFixed(2);

       	}catch(e){
      		return false;
       		// symbolVal.up = false;
	        // symbolVal.rate = '--';
	        // symbolVal.rateVal = '--';
       	}

	    return symbolVal;
	}
	
	_getParams() {
		var type = this.curIndex ? 'all' : 'follow';


		var fliterSymbolEls = $('.J_CheckSymbol:checked', this.el),
			fliterSymbols = [];

		for ( var i = 0, len = fliterSymbolEls.length; i < len; i++ ) {
            fliterSymbols.push($(fliterSymbolEls[i]).val())
        }

        fliterSymbols = fliterSymbols.toString();


		return {
			access_token: this.cookie.get('token'),
			symbols: fliterSymbols,
			type: type,
			limit: 9
		}
	}

	_responsive() {
		var winHeight = $(window).height();
	    var headerHeight = $('header').height();
	    $('.bd', '#J_ActualOrder').height(winHeight - 38 - headerHeight - 10);
	}

	_initAttrs() {
		this.render(tmpl, {}, this.el);
		this.listWrapEl = $('.J_List', this.el);
		this.triggerEl = $('.J_FilterCalendar', this.el);
	}
	defaults() {
		return {
			curIndex: 1,//   默认全部
			base5Time: {
				time: 1000 * 60 * 5,
				desc: '5分钟前'
			},
			base15Time: {
				time: 1000 * 60 * 15,
				desc: '15分钟前'
			},
			base30Time: {
				time: 1000 * 60 * 30,
				desc: '30分钟前'
			},
			base60Time: {
				time: 1000 * 60 * 60,
				desc: '1小时前'
			},
			base5HTime: {
				time: 1000 * 60 * 60 * 5,
				desc: '5小时前'
			},
			base1DTime: {
				time: 1000 * 60 * 60 * 24,
				desc: '1日前'
			}
		}
	}
}

module.exports = ActualOrder;
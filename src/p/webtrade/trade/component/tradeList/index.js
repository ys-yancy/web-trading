/**
 *   交易榜单
 */

'use strict';

require('./index.css');
var Base = require('../../../../../app/base');
var Config = require('../../../../../app/config');
var CreateMiniChart = require('../../../../../common/chart/miniLine-basic');
var FollowOrder = require('../follow-order');
var tmpl = require('./index.ejs.html');
var listTmpl = require('./list.ejs.html');

class TradeList extends Base {
	constructor(config) {
		super(config);

		this._initAttrs();
		this._init();
	}

	_init() {
		this._bind();
		this._getData();
	}

	_bind() {

		// 显示隐藏选项条
		this.el.on('click', '.J_Trigger', _.bind(this._toggleFilter, this));
    	this.el.on('mouseleave', '.J_Trigger', _.bind(this._hideFilter, this));
    	this.el.on('click', '.J_Item', _.bind(this._switch, this));

    	this.el.on('click', '.J_UserFollow', (e) => {
    		var curEl = $(e.currentTarget);
    		var id = curEl.attr('data-id');
    		
    		// if ( curEl.hasClass('show') ) {
    		// 	return;
    		// }

    		this._showFollowOrder(curEl, id);
			// curEl.siblings().removeClass('show');
   //  		curEl.addClass('show');
    	})
	}

	_toggleFilter(e) {
    	this.triggerEl.toggleClass('active');
  }

  _hideFilter(e) {
  	  this.triggerEl.removeClass('active');
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

	    this._getData();

	}

	_getData() {
  		var params = this._getParams();
  		var source = this._getSource();
  		this._request(params, source);
  	}

  	_request(params, source) {
  		/**
  		 * @ yield_rate_7days
  		 * @ yield_rate_30days
  		 * @ yield_rate
  		 */
  		var source = source || 'yield_rate_7days';
  		this.ajax({
  			url: '/v1/follow/rank/expert/profit/'+ source +'/',
  			data: params
  		}).then((data) => {
  			data = data.data;
  			this._render(data);
  		})
  	}

  	_render(data) {
      data = data.map((item) => {
        item.img = item.img ? Config.getAvatarPrefix(item.img) : getDefaultAvatarUrl();
        return item;
      })

  		this.render(listTmpl, data, this.listConntent);
  		this._renderCharts(data);
  	}

  	_renderCharts(data) {
  		var chartWraperEls = $('.J_TradelistChart', this.listConntent);

  		for ( var i = 0, len = data.length; i < len; i++ ) {
  			var list = [];
  			var chartWraperEl = $(chartWraperEls[i]);

  			list = data[i].profit_history.map((item, index) => {
  				return item.amount;
  			})

  			new CreateMiniChart({
  				el: chartWraperEl,
				chartName: 'trade-list-charts-rate',
				data: list
  			})
  		}
  	}

  	_showFollowOrder(referEl, id) {
  		this.followOrder = new FollowOrder({
			referEl: referEl,
			id: id
		}).on('refresh', (data) => {
			console.log('refresh');
		}).on('destroy', (data) => {
			console.log('destroy');
		})
  	}

  	_getParams() {
  		var params = new Object();
  		params.access_token = this.cookie.get('token');
  		return params;
  	}

  	_getSource() {
  		var activeEl = $('.active', this.category);
  		var index = activeEl.index();
  		var curSource = this.sourceUrls[index];
  		return curSource;
  	}

	_initAttrs() {
		this.render(tmpl, {}, this.el);
		this.category = $('.J_CategoryFilter', this.el);
		this.triggerEl = $('.J_FilterTradeList', this.el);
		this.listConntent = $('#TradeListConntent', this.le);
	}

	defaults() {
		return {
			sourceUrls: ['yield_rate_7days', 'yield_rate_30days', 'yield_rate']
		}
	}	
}

module.exports = TradeList;
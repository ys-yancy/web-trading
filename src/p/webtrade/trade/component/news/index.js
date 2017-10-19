/*  新闻模块 */

'use strict';

require('./index.css');
const Base = require('../../../../../app/base');
const Util = require('../../../../../app/util');
const Config = require('../../../../../app/config');
const tmpl = require('./index.ejs.html');
const listTmpl = require('./list.ejs.html');

class News extends Base {
	constructor(config) {
		super(config);
		this._init();
	}

	_init() {
		this.firstRender = true; // 是否为第一次渲染
		this._getData();
		this.subscribe('resize:window', this._responsive, this);
	}

	_lazyBind() {
		this.noScroll = true;
		this._responsive();
		this._initAttrs();
	    this.bdEl.on('scroll', _.bind(this.getData, this));
  	}

  	getData() {
  		/*
  		 * 函数节流
  		 */
  		var self = this;
  		self.noScroll = false;

  		if ( this.bdEl.scrollTop() < 100 ) {
  			self.noScroll = true;
  			this.firstRender = true;
  		}

  		clearTimeout(this.getDtaTimer);

  		this.getDtaTimer = setTimeout(() => {
  			loadMore();
  		}, 50);

  		function loadMore() {
  			var isLoadMore = self.isLoadMore();
	  		if ( isLoadMore ) {
	  			self.firstRender = false;
	  			self._getData({
	  				endtime: self.lastTime
	  			});
	  		}
  		}
  	}

	_getData(params) {
		params = params || {};
		var data = this._getParams();
		data = $.extend(data, params);
		this._request(data);
	}

	_request(params) {
		this.ajax({
			url: 'http://apitest.invhero.com/v1/news/list/',
			data: params,
			unjoin: true
		}).then((data) => {
			data = data.data;

			this._setLastTime(data);

			var curId = data[0].id;

			if ( !this.firstId || (this.firstId != curId && this.noScroll)) {
				data[0].isFirst = true;
			}

			this.firstId = curId;
			this._render(data, this.firstRender);

		})
	}

	_setInterval() {
		clearTimeout(this.newsSetControls);

		this.newsSetControls = setTimeout(() => {
			if ( this.noScroll ) {
				this._getData();
			}
			this._setInterval();
		}, Config.getNewsUpdateTime());
	}

	_getParams() {
		var data = {
			start: 0,
			length: 20,
			time: Util.getDate(),
			type: '01',
			resource: 'jin10',
		}

		return data;
	}

	_setLastTime(data) {
		var lastData= data[data.length - 1];
		this.lastTime = data[data.length - 1].time;
		return this.lastTime;
	}

	_clearFirst() {
		setTimeout(() => {
			$('.first', this.bdEl).removeClass('first');
		}, 1800)
	}

	isLoadMore() {
		var baseHeight = 100;
		var result = this.bdEl.height() + this.bdEl.scrollTop() + baseHeight >= this.listContentEl.height();
		return result;
	}

	_render(data, isFirstRender) {
		if ( isFirstRender ) {
			this.render(tmpl, {list: data}, this.contentEl);
			this._lazyBind();
		} else {
			this.renderTo(listTmpl, {list: data}, $('.J_List', this.contentEl));
		}
		
		this._clearFirst();
	}

	destroy() {
		console.log('destroy:news');
		clearTimeout(this.newsSetControls);
	}

	rebuild() {
		console.log('rebuild:news');
		this._setInterval();
	}

	_responsive() {
		var winHeight = $(window).height();
	    var headerHeight = $('header').height();
	    $('.bd', '#J_NewMessage').height(winHeight - 38 - headerHeight - 10);
	}

	_initAttrs() {
		this.bdEl = $('.bd', this.contentEl);
		this.listContentEl = $('.list', this.contentEl);
	}
}

module.exports = News;
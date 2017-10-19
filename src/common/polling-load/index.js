"use strict";

var Base = require('../../app/base');
var win = $(window);
var doc = $(document);

class PollingLoad extends Base {
	constructor(config) {
		super(config);

		this.referEl = this.referEl || doc;
		this.el = this.el || win;
		this.init();
	}

	init() {
		this._getData();
		// this._bind();
	}

	_bind() {
		this.referEl.on('scroll', $.proxy(this._scrollLoad, this));
	}

	setUrl(url) {
		if ( !url ) {
			this.requestUrl = url;
			return this.requestUrl;
		}
	}

	getUrl() {
		return this.requestUrl;
	}

	setRequestType(type) {
		if ( !type ) {
			return this.requestType;
		}

		this.requestType = type;
		return this;
	}

	setParams(key, value) {
		if ( !value && $.isPlainObject(key) ) {
			this.params = key;
			return this;
		}

		this.params.key = value;
		return this;
	}

	getParams(key) {
		if ( !key ) {
			return this.params;
		}

		if ( this.params.hasOwnProperty(key) ) {
			return this.params[key];
		} else {
			return undefined;
		}
	}

	getData(params) {
		this._getData();
	}

	destroy() {
		clearTimeout(this.setInterController);
	}

	rebuild() {
		this._rebuild();
	}

	_scrollLoad() {
		if (this._isScrollTop()) {
			this.reBuild();
		} else if (this._isLoadMore()) {
			//加载更多
		} else {
			this.destroy();
		}
	}

	_isLoadMore() {
		var result = this.referEl.height() + this.referEl.scrollTop() + bufferHeight >= this.el.height();
		return result;
	}

	_isScrollTop() {
		clearTimeout(this.isScrollTopControl);
		this.isScrollTopControl = setTimeout(() => {
			return this.this.referEl.scrollTop() - this.baseHeight <= 0;
		})
	}

	_setInterval() {
		clearTimeout(this.setInterController);
		this.setInterController = setTimeout(() => {
			this._getData();
		}, this.setIntervalTime)
	}

	_rebuild() {
		this._setInterval();
	}

	_getData() {
		this._request().then((data) => {
			this.successCallback.call(this.scope, data);
			if (this.isSetInterval) {
				this._setInterval();
			}
		})
	}

	_request() {
		return this.ajax({
			url: this.requestUrl,
			data: this.params,
			type: this.requestType,
			unjoin: this.isUnjoin,
			hideError: true
		}).then((data) => {
			return data.data;
		}, (err) => {
			// this.errorCallback('error');
			return 'err'
		})
	}

	defaults() {
		return {
			requestUrl: '',
			requestType: 'GET',
			params: {},
			isUnjoin: false,
			isSetInterval: true,  // 是否开启定时刷新
			setIntervalTime: 1000 * 30,  //刷新时间
			successCallback: function() {},
			errorCallback: function() {},
			bufferHeight: 100,   // 缓存高度
			baseHeight: 10  //是否到达顶部
		}
	}
}

module.exports = PollingLoad;
/**
 * 加载模块
 */

"use strict";

var Base = require('../../../../../app/base');
var MoveOrderContent = require('../../../../../common/move');
var OrderDetail = require('../order-detail');
var Pocket = require('../pocket');
var News = require('../news');
var About = require('../about');
var Calendar = require('../calendar');
var ActualOrder = require('../actual-order');
var TradeList = require('../tradeList');
var MyFollowOrder = require('../my-followorder');

class LoadModules extends Base {
	constructor(config) {
		super(config);

		this._loadModules = {};
		this._initAttrs();
		this._bind();
	}

	_bind() {
		$(window).on('load', _.bind(this._load, this));

		this.sidebarEl.on('mouseenter', '.tab-nav', (e) => {
			clearTimeout(this.loadControls)
			this.loadControls = setTimeout(() => {
				this._lazyLoad(e);
			}, 30);
		});

		this.subscribe('update:modules', this._destroy, this);

	}

	_load() {
		new OrderDetail({ containerEl: $('#J_OrderDetail') });
		new MoveOrderContent({el: $('#J_OrderTab')});
		console.log('load:modules:success');
	}

	_lazyLoad(e) {
		var curEl = $(e.target);

		if ( curEl.hasClass('sidebar-icon') ) {
			curEl = curEl.parent('.tab-nav');
		}

		var index = curEl.index();
		var isLoaded = this._isLoaded(index);
		var _name = this.moduleNameList[index];

		this._createModule(index, isLoaded, _name)

	}

	_documentLoaded() {
		setTimeout(()=> {
			var len = this.moduleNameList.length;
			for ( let i = 0; i < len; i++ ) {
				this._lazyLoad('', i);
			}
		}, 8000);
	}

	_createModule(index, isLoaded, _name) {
		if ( index == 2 && !isLoaded ) {
			this._loadModules[_name] = new Pocket({el: $('#J_AccountDetail')});
			console.log("new:Pocket:success")
		}
		else if ( index == 3 && !isLoaded ) {
			this._loadModules[_name] = new Calendar({contentEl: $('#J_Calendar')});
			console.log('new:Calendar:success');
		} else if( index == 4 && !isLoaded ) {
			this._loadModules[_name] = new TradeList({el: $('#J_TradeList')});
		}
		else if(index == 5 && !isLoaded) {
			this._loadModules[_name] = new ActualOrder({el: $('#J_ActualOrder')});
			console.log('new:ActualOrder:success');
		} else if (index == 6 && !isLoaded) {
			this._loadModules[_name] = new MyFollowOrder({el: $('#J_MyFollowOrder')});
		}
		else if ( index == 8 && !isLoaded ) {
			this._loadModules[_name] = new News({contentEl: $('#J_NewMessage')});
			console.log("new:News:success")
		}
		else if( index == 9 && !isLoaded ) {
			this._loadModules[_name] = new About({contentEl: $('#J_About')});
			console.log("new:About:success")
		}
	}

	_isLoaded(index) {
		var _name = this.moduleNameList[index];
		return this._loadModules[_name];
	}

	_destroy(curEL) {
		var index = curEL.index(),
			moduleName = this.moduleNameList[index];
		Object.keys(this._loadModules).forEach((key, index) => {
			var isSameKey = moduleName == key,
				_destroy = this._loadModules[key].destroy,
				_rebuild = this._loadModules[key].rebuild;
				
			if( !isSameKey && _destroy && $.isFunction(_destroy) ) {
				_destroy.apply(this._loadModules[key], []);
			} else if(isSameKey && _rebuild && $.isFunction(_rebuild)) {
				_rebuild.apply(this._loadModules[key], []);
			}
		})
	}

	_initAttrs() {
		this.sidebarEl = $('.sidebar');
	}

	defaults() {
		return {
			moduleNameList: [false, false, 'Pocket', 'Calendar', 'TradeList', 'ActualOrder', 'MyFollowOrder', false, 'News', 'About', false]
		}
	}
}

module.exports = LoadModules;
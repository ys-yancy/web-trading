'use strict';

var Core = require('../../../../../../app/core');
var Util = require('../../../../../../app/util');
var InfinityScroll = require('../../../../../../common/infinite-scroll');
var DelSymbolDialog = require('./dialog');
var tmpl = require('./index.ejs.html');
var itemTmpl = require('./item.ejs.html');
require('./index.css');

export default class Category extends Core {
	constructor(config) {
		super(config);
		// 017-7-14 杨帅修改 // 缺少一个loading
		// this._getCat();
	}
	_bind() {
		this.el.on('click', '.nav-item', (e) => {
			var curEl = $(e.currentTarget);

			if (!curEl.hasClass('active')) {
				var symbol = curEl.attr('data-symbol');
				if (symbol) {
					this._getOption(symbol);
					$('.cat-content').show();
					$('#J_SuggestInner').hide();
				} else {
					// this.parent.
					$('.cat-content').hide();
					$('#J_SuggestInner').show();
				}

				curEl.siblings().removeClass('active');
				curEl.addClass('active');
			}
		});

		// 搜索
		this.el.on('submit', '#J_Search', (e) => {
			e.preventDefault();
			this._search();
		});

		this.el.on('click', '.J_SearchIcon', (e) => {
			e.preventDefault();
			this._search();
		})

		this.el.on('click', '.J_Add', (e) => {
			var curEl = $(e.currentTarget);
			var symbol = curEl.attr('data-symbol');

			this.parent.add(symbol).then(() => {
				// curEl.remove();
				curEl.text('删除')
				curEl.removeClass('add J_Add').addClass('del J_Del');
				new DelSymbolDialog({refEl: curEl, add: true});
			});
		});

		this.el.on('click', '.J_Del', (e) => {
			var curEl = $(e.currentTarget);
			var symbol = curEl.attr('data-symbol');
			this.parent.del(symbol).then(() => {
				curEl.text('添加');
				curEl.removeClass('del J_Del').addClass('add J_Add');
				new DelSymbolDialog({refEl: curEl, add: false});
			})
		})

		this.el.on('click', '.J_CloseCat', (e) => {
			this.hide();
		});

	}

	_search(e) {
		var val = $('#ipt').val();
		$('.nav-item.search').trigger('click');

		$('.nav-item.search').show();
		this.parent.search(val)
	}

	show() {
		// 017-7-14 杨帅修改
		// this.el.show();
		var _width;
		var silderEl = $('.sidebar');
		var isMoreWidth = silderEl.hasClass('setMoreWidth');
		if ( isMoreWidth ) {
			_width = 500;
		} else {
			_width  = 400;
		}
		this.getCat().then((isSuccess) => {
			if ( isSuccess ) {
				_width === 500 ? this.el.addClass('max-width') : this.el.removeClass('max-width');
				this.el.width(_width);
				this.el.show();
				$('#ipt').focus();
			}
		})
	}

	hide() {
		this.el.hide();
	}

	// 017-7-14 杨帅增加
	getCat() {
		if ( !!this.list ) {
			return Promise.resolve(true);   
		} else {
			return this._getCat();
		}
	}

	_getCat() {
		return this.ajax({
				url: '/v1/symbol/category/',
				data: {
					access_token: this.cookie.get('token')
				}
			}).then((data) => {

				this.renderTo(tmpl, { list: data.data }, document.body);
				this.list = data.data;
				this.el = $('#J_Category');

				this.contentEl = $($('.cat-content', this.el)[0]);
				this._getOption(this.list[0].name);
				this._bind();

				var wraperHeight = $('#J_Category').height();
        // height 方法获取的是内容宽度 所以要加11 
				var hdHeight = $('#J_Search').height() + 11;

				$('#J_CatContent').css({
					'height': wraperHeight - hdHeight,
					'overflow': 'scroll'
				});
				$('.cat-nav').css({
					'height': wraperHeight - hdHeight,
					'overflow': 'scroll'
				});
				return Promise.resolve(true)
			});
	}

	_getOption(category) {
		this._infinite(category);

		return;
		var url = this._getUrl();

		var token = Cookie.get('token');
		this.ajax({
			url: url,
			data: {
				access_token: token,
				category: category,
				start: 0,
				count: 20

			}
		}).then((data) => {
			// console.log(data);

			data.data.forEach((item) => {
				if (this.option.has(item.policy.symbol)) {
					item.hasAdd = true;
				}
			});

			this.render(itemTmpl, { list: data.data }, this.contentEl);
		})
	}

	_infinite(category) {
		var url = this._getUrl();
		var token = Cookie.get('token');
		var suggestInnerEl = $('#J_CatContainer');
		var count = 40;
		var params = {
			access_token: token,
			category: category,
			start: 0,
			count: count,
		};

	
		this.infinity && this.infinity.destroy();

		this.infinity = new InfinityScroll({
			loadingConfig: {
				el: $('#J_Loading'),
				needInit: false,
			},
			params: params,
			el: suggestInnerEl,
			referEl: suggestInnerEl.parent(),
			url: url,
			tmpl: itemTmpl,
			emptyTmpl: '暂无内容',
			infinite: true,
			hasNextPage: true,
			beforeRequest: function(params) {
				return {
					count: count,
					start: params.page * count
				};
			},
			parse: (data, params) => {
				if (data && data.data) {
					var hasNextPage = true;

					if (data.data.length === 0 || data.data.length < count) {
						hasNextPage = false;
					}
					var symbols = [];

					data.data.forEach((item) => {
						if (this.option.has(item.policy.symbol)) {
							item.hasAdd = true;
						}
					});

					if (params.page === 0) {
						suggestInnerEl.html('');
					}

					// suggestInnerEl.parent().show();

					// self._getCategory(symbols);


					return {
						data: data.data,
						hasNextPage: hasNextPage
					}
				}

				return data;
			},

			callback: function() {

			}
		});
	}

	_getUrl() {
		// 实盘  actual quotation
		var demo = this.isDemo();

		var url = demo ? '/v3/demo/symbols/' : '/v3/real/symbols/';
		return url;
	}

}

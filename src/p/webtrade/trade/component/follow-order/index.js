/**
 * 跟单
 */

"use strict";
require('./index.css');
var Base = require('../../../../../app/base');
var app = require('../../../../../app');
var Config = require('../../../../../app/config');
var TradeConut = require('./trade-count');
var TradeCurrent = require('./trade-current');
var TradeHistory = require('./trade-history');
var FollowAction = require('./follow-action');
var Dialog = require('./dialog');
var tmpl = require('./index.ejs.html');

class FollowOrder extends Base {
	constructor(config) {
		super(config);

		this._component = {};
		
		this._render().then(() => {
			this.setPos(this.referEl);
			this.init();
		}, () => {
			console.log('error')
			this.setPos(this.referEl);
			this.init();
		})
		
	}

	init() {
		this._bind();
		this._initAttrs();
		this._requires();
		this._responsive();
	}

	_bind() {
		var doc = $(document);

		doc.on('click', (e) => {
			var targetEl = $(e.toElement || e.relatedTarget || e.target);
			//&& !targetEl.hasClass('active')
			if (targetEl.parents('#J_SidebarInner').length > 0 && this.el) {
				this._close();
			}
		})

		
		this.el.on('click', '.J_Tab', _.bind(this._switch, this));

		this.el.on('click', '.J_Close', _.bind(this._close, this));

		this.el.on('click', '.J_Follow', _.bind(this._showFollowAction, this));

		//更多设置
		this.el.on('click', '.J_ReviseSetting', _.bind(this._showFollowActionMore, this))

		// 关注榜单
		this.el.on('click', '.J_Attention', _.bind(this._submitAttention, this));
		this.el.on('click', '.J_CancelAttention', _.bind(this._cancelAttention, this));

		//暂停跟随
		this.el.on('click', '.J_PauseFollow', _.bind(this._pauseFollow, this));
		//继续跟随
		this.el.on('click', '.J_KeepFollow', _.bind(this._keepFollow, this));
		//取消跟随
		this.el.on('click', '.J_CancelFollow', _.bind(this._cancelFollow, this));
		// 启用跟随
		this.el.on('click', '.J_ReFollow',  _.bind(this._reFollow, this))
		
		this.subscribe('resize:window', this._responsive, this);
		this.subscribe('resize:window', this.setPos, this);
	}

	_switch(e) {
		var curEl = $(e.target),
			index = curEl.index(),
			contentEls = $('.J_ContentFollow', this.el),
			curContentEl = $(contentEls[index]);

		if ( curEl.hasClass('active') ) {
			return;
		}

		curEl.siblings('.J_Tab').removeClass('active');
		contentEls.removeClass('active').hide();
		curContentEl.addClass('show').show();
		curEl.addClass('active');

	}

	_attentionAction(source) {
		var data = {
			access_token: this.cookie.get('token')
		}
		return this.ajax({
			url: '/v1/follow/follower/expert/'+ this.id +'/'+ source +'/',
			data: data,
			type: 'POST',
			hideError: true
		}).then((data) => {
			return data;
		})
	}
	_submitAttention() {
		this._attentionAction('follow').then((data) => {
			if (data.status == 200) {
				var attentionEl = $('.J_Attention', this.el);
				app.success('关注成功', 1000);
				this._toggleBtn(attentionEl, '.J_CancelAttention');
			}
		})
	}

	_cancelAttention() {
		this._attentionAction('unfollow').then((data) => {
			if (data.status == 200) {
				var cancelAttention = $('.J_CancelAttention', this.el);
				app.success('取消成功', 1000);
				this._toggleBtn(cancelAttention, '.J_Attention');
			}
		})
	}

	_reFollow() {
		this._request('enable').then((data) => {
			var reFollowEl = $('.J_ReFollow', this.el),
				isPause = this.exportData.follow_paused == 1;
			app.success('启用成功', 1500);
			this._toggleBtn(reFollowEl, '.J_CancelFollow');
			// this.referEl.removeClass('unfollow').addClass('follow');

			if ( isPause ) {
				$('.J_KeepFollow', this.el).removeClass('hidden')
			} else {
				$('.J_PauseFollow', this.el).removeClass('hidden')
			}
		})
	}

	_cancelFollow() {
		new Dialog().on('confirm', () => {
			this._request('cancel').then((data) => {
				var reFollowEl = $('.J_CancelFollow', this.el);
				this._toggleBtn(reFollowEl, '.J_ReFollow');
				// this.referEl.removeClass('follow').addClass('unfollow');
				// app.success('您已取消跟单', 1500);
			})
		})
	}

	_keepFollow() {
		this._request('unpause').then((data) => {
			var keepFollowEl = $('.J_KeepFollow', this.el);
			app.success('您已恢复跟随', 1500);
			this._toggleBtn(keepFollowEl, '.J_PauseFollow');
		})
	}

	_pauseFollow() {
		this._request('pause').then((data) => {
			var pauseFollowEl = $('.J_PauseFollow', this.el);
			app.success('您已暂停跟单', 1500);
			this._toggleBtn(pauseFollowEl, '.J_KeepFollow');
		})
	}

	_request(source) {
		var data = {
			access_token: this.cookie.get('token')
		}
		return this.ajax({
			url: '/v1/follow/follower/expert/'+ this.id +'/'+ source +'/',
			data: data,
			type: 'POST'
		}).then((data) => {
			return data
		})
	}

	_showFollowAction() {
		new FollowAction({
			id: this.id,
			follower_balance_threshold: this.follower_balance_threshold
		}).on('follow:order:success', () => {
			var isPause = this.exportData.follow_paused == 1;
			var startEl = $('.J_Follow', this.el);
			startEl.addClass('hidden');
			if (isPause) {
				startEl.siblings('.J_Pauseing').removeClass('hidden');
			} else {
				startEl.siblings('.J_Following').removeClass('hidden');
			}
		})
	}

	_showFollowActionMore() {
		new FollowAction({
			id: this.id,
			isMore: true,
			follower_balance_threshold: this.follower_balance_threshold
		})
	}

	_toggleBtn(curBtnEl, nextClass) {
		curBtnEl.addClass('hidden');
		curBtnEl.siblings(nextClass).removeClass('hidden');
	}

	setPos(el) {
	    var setwidth;
	    var silderEl = $('.sidebar');
	    var referEl = el || this.referEl;
	    var position = referEl.offset();

	    var firstChildEl = referEl.parent().children('tr').eq(0);
	    var childPosition = firstChildEl.offset();

	    var isMoreWidth = silderEl.hasClass('setMoreWidth');
	    setwidth = isMoreWidth ? 500 : 400;

	    this.el.css({
	      	width: setwidth
	      	// left: position.left,
	      	// top: childPosition.top
	    });

	    this.el.show();

	    this.placeholdEl = $('<tr class="follow-cushion"></tr>');

	    if (!el) {
	      return;
	    }

	    this.placeholdEl.height(this.el.outerHeight() - this.referEl.height());
	    referEl.after(this.placeholdEl);
  	}

  	_close() {
  		console.log('close');

  		// if ( this.referEl.hasClass('unfollow') ) {
  		// 	this.referEl.hide().remove();
  		// }

  		this.destroy();
  	}

  	_destroycomponent() {
  		Object.keys(this._component).forEach((componentKey, index) => {
  			this._component[componentKey].fire('destroy');
  		})
  	}

  	destroy() {
  		this.el && this.el.off('click');
  		this.el && this.el.hide().remove();
  		this.placeholdEl && this.placeholdEl.remove();
  		this.unsubscribe('resize:window', this._responsive, this);
  		this.unsubscribe('resize:window', this.setPos, this);
  		this._destroycomponent();
  		this.fire('destroy');
  		this.off('refresh');
  		this.off('destroy');
  		this.el = null;
  	}

	_render() {
		var data = {
			access_token: this.cookie.get('token'),
			expert_id: this.id
		}

		return this.ajax({
			url: this._getUrl(),
			data: data
		}).then((data) => {
			var _data;
			_data = data.data[0];
			
			if ( this.isMy ) {
				_data = data.data;
			}

			// _data.img = data.img ? data.img : getDefaultAvatarUrl();
			_data.img = data.img ? Config.getAvatarPrefix(data.img) : getDefaultAvatarUrl();
			_data.isMy = this.isMy;
			this.exportData = _data;
			this.follower_balance_threshold = _data.follower_balance_threshold;
			this.el = this.renderTo(tmpl, _data, $('body'));
		})
	}

	_getUrl() {
		var url = this.isMy ? '/v1/follow/follower/expert/'+ this.id +'/summary/' : '/v1/follow/rank/expert/'+ this.id +'/summary/';
		return url;
	}

	_requires() {
		this._component = {
			TradeCurrent: new TradeCurrent({
				el: $('#J_TradeCurrent', this.el),
				id: this.id,
				isMy: this.isMy
			}),

			TradeHistory: new TradeHistory({
				el: $('#J_TradeHistory', this.el),
				id: this.id,
				isMy: this.isMy
			})
		}

		if ( !this.isMy ) {
			this._component['TradeConut'] = new TradeConut({
				el: $('#J_TradeCount', this.el),
				id: this.id
			})
		}
	}

	_responsive() {
		var winHeight = $(window).height();
	    var headerHeight = $('header').height();
	    this.wrapEl.height(winHeight - headerHeight - 48);
	    this.bdEl.height(winHeight - headerHeight - this.hdEl.height() - this.navEl.height() - 63);
	}

	_initAttrs() {
		this.wrapEl = $('#J_FollowOrder');
		this.hdEl = $('.hd', '#J_FollowOrder');
		this.navEl = $('nav', '#J_FollowOrder');
		this.bdEl = $('.bd', '#J_FollowOrder');
	}
}

module.exports = FollowOrder;
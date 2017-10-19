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

class MyFollowOrder extends Base {
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

      this.subscribe('update:gendan:list', this._updateGendanList, this);
  		// 显示隐藏选项条
    	this.el.on('click', '.J_MyFollow', (e) => {
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

    _updateGendanList() {
      this._getData();
    }


	  _getData() {
  		var params = {
        access_token: this.cookie.get('token')
      }
  		this._request(params);
  	}

  	_request(params) {
  		this.ajax({
  			url: '/v1/follow/follower/expert/list/',
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

  		this.render(listTmpl, {list: data}, this.listConntent);
  	}

  	_showFollowOrder(referEl, id) {
  		this.followOrder = new FollowOrder({
			referEl: referEl,
			id: id,
      isMy: true
		}).on('refresh', (data) => {
			console.log('refresh');
		}).on('destroy', (data) => {
			console.log('destroy');
		})
  	}


	_initAttrs() {
		this.render(tmpl, {}, this.el);
		this.listConntent = $('#J_MyFollowListConntent', this.el);
	}
}

module.exports = MyFollowOrder;
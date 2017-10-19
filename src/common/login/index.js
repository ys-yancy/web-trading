'use strict';

var Base = require('../../app/base');
var Config = require('../../app/config');

export default class Login extends Base {
  constructor(config) {
    super(config);

    this._bind();
    this._interval();

    this.prevTime = (new Date()).getTime();
  }

  _bind() {
    $(document).on('mousemove', _.bind(this._move, this));
  }

  _move(e) {
    var current = (new Date()).getTime();

    if (current - this.prevTime > Config.getRealPasswordExpireTime()) {
      location.href = './login.html?redirect_url=' + encodeURIComponent(location.href);
    }
    this.prevTime = (new Date()).getTime();

    this.action = true;
  }

  _interval() {
    // 检测用户是否持续操作
    setInterval(() => {
      if (this.action) {
        var realToken = Cookie.get('real_token');

        if (realToken) {
          Cookie.set('real_token', realToken, {
            expires: Config.getRealPasswordExpireTime()
          });
        }
      }
    }, 60 * 1000);
  }
}
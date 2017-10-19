"use strict";

var Cookie = require('../lib/cookie');

module.exports = {
  login: function(keep) {
    var token = Cookie.get('token'),
      phone = Cookie.get('phone');

    return new Promise(function(resolve, reject) {
      if (token && phone) {
        resolve(true);
      } else {
        if (!keep) {
          location.href = './login.html?redirect_url=' + encodeURIComponent(location.href);
        }
        reject(false);
      }
    });
  },

  logout: function(goLogin) {
    if ( goLogin ) {
      Cookie.expire('real_token');
    } else {
      Cookie.expire('real_token');
      Cookie.expire('phone');
      // Cookie.expire('goType');
      // Cookie.expire('type');
      Cookie.expire('avator');
      Cookie.expire('usernick');
      Cookie.expire('token');
    }
   
    if (goLogin) {
      window.location = './login.html';
    }
  },

  getToken: function() {
    return new Promise(function(resolve, reject) {
      if (Cookie.get('token') && Cookie.get('phone')) {
        resolve(Cookie.get('token'));
      } else {
        reject();
      }
    });
  }
}
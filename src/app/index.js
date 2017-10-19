var storage = require('./storage');
var Message = require('../common/message');
var components = [];

export default {
  // 一键删除挂单
  oneKeyDel(open) {
      if (open !== undefined) {
        if (open) {
          storage.set('one-key-del-guadan', true);
        } else {
          storage.remove('one-key-del-guadan');
        }
      }

      return storage.get('one-key-del-guadan') === 'true';
    },

    // 一键平仓
    oneKeyClose(open) {
      if (open !== undefined) {
        if (open) {
          storage.set('one-key-close-order', true);
        } else {
          storage.remove('one-key-close-order');
        }
      }

      return storage.get('one-key-close-order') === 'true';
    },

    success(message, disappearTime) {
      new Message({
        type: 'success',
        message: message,
        disappearTime: disappearTime
      });
    },

    error(message, disappearTime) {
      new Message({
        type: 'error',
        message: message,
        disappearTime: disappearTime
      });
    },

    mount(componentObj) {
      for (var i in componentObj) {
        if (componentObj.hasOwnProperty(i)) {
          if (!this.get(componentObj.name)) {
            components.push({
              name: i,
              component: componentObj[i]
            });
          }
        }
      }
    },

    proxy(componentKey, method) {
      var component = this.get(componentKey);

      var args = Array.prototype.slice.call(arguments, 2);

      return component[method].apply(component, args);
    },

    get(key) {
      var component = null;
      components.forEach((item) => {
        if (item.name === key) {
          component = item.component;
        }
      });

      return component;
    }
};
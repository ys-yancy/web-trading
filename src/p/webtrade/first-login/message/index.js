/**
 * 用于展示表单校验的错误信息
 */

require('./index.css');

module.exports = {
  showError(wrapperEl, message, hide) {
    var errorEl = $('.err', wrapperEl);

    wrapperEl.addClass('error');

    if (errorEl.length > 0) {
      errorEl.text(message);
      return;
    }

    wrapperEl.append('<div class="err">' + message + '</div>');

    if (hide) {
      setTimeout(() => {
        this.hideError(wrapperEl);
      }, 1000);
    }
  },

  hideError(wrapperEl) {
    wrapperEl.removeClass('error');
  }
}
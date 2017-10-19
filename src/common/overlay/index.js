require('./index.css')
/**
 * @ config : {} 配置对象
 * @ parentEl: 容器
 * @ headerEl: 内容块中header高度
 * @ tagName: 遮罩元素标签名 默认tr
 * @ background: 遮罩颜色 默认rgba(0,0,0,0.3)
 * @ zIndex: 层级 默认10 
 */

class Overlay {
	constructor(config) {
		this.config = config;
		this.parentEl = config.parentEl;
		this.parentEl.css('position', 'relative')
		
		this.init(config);	
	}

	init(config) {
		this.defaults();
		this.initAttrs();
	}

	toggleShow(curEl, isOption) {
		var isHasClassShow = this.parentEl.hasClass('show');

		if( !isHasClassShow ) {
			this.show(curEl, isOption);
		} else {
			this.hide(curEl, isOption);
		}
		
	}

	show(curEl, isOption) {
		this.curEl = curEl;
		var rect = this._getElBoundingClientRect(curEl);
		if( rect.prevRect ) {
			this.overlayTopEl.css('height', rect.curRect.top);// - curEl.height()
			this.overlayTopEl.show();
		} else {
			this.overlayTopEl.hide();
		}	

		if( rect.nextRect ) {
			this.overlayBottomEl.css('top', rect.nextRect.top + 'px');
			!isOption && this.overlayBottomEl.css('bottom', rect.nextRect._bottom + 'px');
			this.overlayBottomEl.show();
		} else {
			this.overlayBottomEl.hide();
		}
		this.curEl.siblings().removeClass('overlaying');
		this.curEl.addClass('overlaying')
		this.parentEl.addClass('show');
		this.parentEl.attr({
			'data-topEl-height': rect.curRect.top ,//- curEl.height()
			'data-bottomEl-top': rect.nextRect ? rect.nextRect.top : false
		})
	}

	hide() {
		this.overlayTopEl.hide();
		this.overlayBottomEl.hide();
		this.parentEl.removeClass('show');
		this.curEl && this.curEl.removeClass('overlaying');
		this.parentEl.removeAttr('data-topEl-top data-topEl-height data-bottomEl-top');
	}

	setWidth(isC) {
		if( isC ) {
			this._setWidth('auto');
		} else {
			setTimeout(() => {
				var _width = this.parentEl.width();
				this._setWidth(_width);
			}, 100)
		}
	}

	_setWidth(width) {
		this.overlayTopEl.css('width', width);
		this.overlayBottomEl.css('width', width);
	}

	_getElBoundingClientRect(curEl) {
		var prevEl = curEl.prev('tr'),
			nextEl = curEl.next('tr');
		var curElBoundingClientRect = curEl.position(),
			prevElBoundingClientRect = prevEl.position(),
			nextElBoundingClientRect = nextEl.position();
		var curRect, prevRect, nextRect;
		if ( curEl.length ) {
			// 在这里简单适配一下app
			var _top = curElBoundingClientRect.top;
			if ( this.isPcApk() && this.config.isScrollTop ) {
				_top = _top - curEl.height() - 1;
			}
			curRect = {
				top: _top,
				bottom: curElBoundingClientRect.top + curEl.height()
			};
		}
		
		if( prevEl.length ) {
			prevRect = {
				top: prevElBoundingClientRect.top,
				bottom: prevElBoundingClientRect.top + prevEl.height()
			};
		}

		if( nextEl.length && !nextEl.hasClass('overlay-model') ) {
			nextRect = {
				top: nextElBoundingClientRect.top,
				bottom: nextElBoundingClientRect.top + nextEl.height(),
				_bottom: nextElBoundingClientRect.top - this.parentEl.height()
			}
		}
		
		return {
			curRect: curEl ? curRect: false,
			prevRect: prevEl ? prevRect : false,
			nextRect: nextEl ? nextRect : false
		}

	}

	isFullScreen() {
		return !$('body').attr('class');
	}

	isPcApk() {
		var lo_href = window.location.href;
		if ( lo_href.indexOf('file:///') !== -1) {
			return true;
		} else {
			return false;
		}
	}

	defaults() {
		var tag = this.config.tagName || 'tr';
		this.tmpl = [
			'<' + tag +' class="overlay-model top" style="position:absolute;top:0;left:0;right:0"></' + tag + '>', 
			'<' + tag +' class="overlay-model bottom" style="position:absolute;left:0;right:0;bottom:0;"></' + tag + '>'
		].join('');	

		this.parentEl.append(this.tmpl);	
	}

	initAttrs() {
		var _top = 0;
		if ( this.isPcApk() && this.config.isScrollTop ) {
			// 简单适配app
			_top = -40;
		}
		this.overlayTopEl = $('.overlay-model.top', this.parentEl).css({
			// top: this.config.headerEl.height() || 37,
			top: _top,
			background: this.config.background || 'rgba(0,0,0,0.3)',
			'z-index': this.config.zIndex || 10,
		}).hide().on('click', () => { return false });

		this.overlayBottomEl = $('.overlay-model.bottom', this.parentEl).css({
			height: 'auto',
			background: this.config.background || 'rgba(0,0,0,0.3)',
			'z-index': this.config.zIndex || 10,
		}).hide().on('click', () => { return false })

		var topElHeight = this.parentEl.attr('data-topEl-height'),
			bottomElTop = this.parentEl.attr('data-bottomEl-top');

		if( topElHeight ) {
			this.overlayTopEl.css('height', topElHeight)
			this.overlayTopEl.show();
		}

		if( bottomElTop ) {
			this.overlayBottomEl.css('top', bottomElTop + 'px')
			this.overlayBottomEl.show();
		}
	}
}

module.exports = Overlay;
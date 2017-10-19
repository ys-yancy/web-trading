class MoveOrderContent {
	constructor(config) {
		this._defineproperty(config);
		this._initAttrs();
		this._bind();
	}

	_bind() {
		this.moveEl.bind('mousedown', $.proxy(this._down, this));
	}

	_lazyBind() {
		$(document).bind('mousemove', $.proxy(this._move, this));
		$(document).bind('mouseup', $.proxy(this.destroy, this));
	}

	_down(e) {
		var position = this.moveEl.offset();
		var curElX = position.left,
			curElY = position.top,
			pageX = e.pageX,
			pageY = e.pageY;

		this.mouseInWrapperX = pageX - curElX;
		this.mouseInWrapperY = pageY - curElY;

		this._lazyBind();
	}

	_move(e) {
		e.stopPropagation();
		e.preventDefault();
		var position = this.moveEl.offset();
		var moveX = e.pageX - this.mouseInWrapperX - position.left,
			moveY = e.pageY - this.mouseInWrapperY - position.top;
		this._moveY(moveY);
		return false;
	}

	_moveY(moveY) {
		this.el.removeClass('hidden');
		this.moveElHeight = this.moveElHeight - moveY;
		var curCharElheight = this.charEl.height() + moveY;
		var isScrollBottom = curCharElheight >= this.charElHeight;

		// 如果是在弹出来的情况下  就以为弹出来的高估计算
		if ( this.el.height() > 200 ) {
			this.moveElHeight = this.el.height() - moveY;
		}

		if (isScrollBottom) {
			this.el.addClass('hidden');
			curCharElheight = this.charElHeight;
			this.moveElHeight = this.moveEl.outerHeight();
		}
		this.el.height(this.moveElHeight);
		this.charEl.height(curCharElheight);
	}

	destroy() {
		console.log('success:destroy');
		$(document).unbind('mousemove mouseup');
	}

	_initAttrs() {
		this.moveEl = $('.trade-hd', this.el);
		this.contentEl = $('tbody', this.el); 
		this.charEl = $('#J_Chart');
		this.bgCharEl = $('#J_BgChart');
		this.charElHeight = this.charEl.height();
		this.contentElHeight = this.contentEl.height();
		this.moveElHeight = this.moveEl.outerHeight();
	}

	_defineproperty(config) {
		Object.keys(config).forEach((item) => {
			this[item] = config[item];
		})
	}
}

module.exports = MoveOrderContent;
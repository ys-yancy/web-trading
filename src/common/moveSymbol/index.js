(function ($) {
    $.fn.extend({
        initTable:function (o) {
            //接受配置参数并设定默认值
            var it = this,
                    hover = o.hover||false,
                    selected = o.selected||false,
                    rowDrag = o.rowDrag||false,
            rowMove =rowDrag?true:(o.rowMove||true),
                    tbody = $(it).children("tbody"),
                    tr = $(it).children("tbody").children("tr");
            var moveAfter = o.moveAfter,
                moveBefore = o.moveBefore,
                scope = o.scope,
                isMove = false;
            //添加事件前先移除对象所有的事件
            it.undelegate();
            //tr的鼠标移动效果
            if (hover) {
                tbody.delegate("tr", "mouseenter", function () {
                    $(this).addClass("tr-hover");
                }).delegate("tr", "mouseleave", function () {
                    $(this).removeClass("tr-hover");
                })
            }
            //tr的选中效果
            if (selected) {
                tbody.delegate("tr","click",function(e){
                    if(e.target.tagName.toLowerCase()=="td"){
                        tbody.children(".tr-selected").removeClass('tr-selected');
                        $(this).addClass('tr-selected');
                    }
                })
            }
            //表格行的移动效果
            if(rowMove){
                var targetEl,mouseDown=false,moveIndex;
                tbody.delegate("tr", "mousedown", function(e){
                    //只对td对象触发
                    // if(e.target.tagName.toLowerCase() === "td"){
                        //按下鼠标时选取行
                        targetEl = this,mouseDown = true;
                        $(this).css("cursor","move");
                        moveBefore(e, targetEl);
                        moveBefore.apply(scope, [e, targetEl]);
                        return false;
                    // }
                }).delegate("tr", "mousemove", function(e){
                    //移动鼠标
                    if (mouseDown) {
                        //释放鼠标键时进行插入
                        if (targetEl != this) {
                            isMove = true;
                            if ($(this).index()>$(targetEl).index()){
                                $($(this)).after(targetEl);
                                moveIndex = $(this).index() + 1;
                            } else {
                                $($(this)).before(targetEl);
                                moveIndex = $(this).index() - 1;
                            }
                        }
                    }
                    return false;
                }).delegate("tr", "mouseup", function (e) {
                    $(tr).css("cursor","pointer");
                    targetEl = null;
                    mouseDown = false;
                    if (isMove) {
                        moveAfter.apply(scope, [e, targetEl, moveIndex]);
                        isMove = false;
                    }
                })
                //鼠标离开表格时,释放所有事件
                it.delegate("tbody", "mouseleave", function (e) {
                    $(tr).css("cursor","pointer");
                    targetEl = null;
                    mouseDown = false;
                })
            }
        }
    })
})(window.jQuery)


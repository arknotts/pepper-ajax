(function ($) {
    //helper function
    $.fn.thisAndChildren = function (selector) {
        return this.filter(selector).add(this.find(selector));
    };

    var settings;

    function prependInputIndexers(content) {
        //add the list-item indexers on form submit
        var allListItems = content.find('[data-behavior=list-item]');

        while (allListItems.length > 0) {
            var first = allListItems.first();
            var oneSetOfListItems = first.add(first.siblings('[data-behavior=list-item]'));

            oneSetOfListItems.each(function (listItemIdx) {
                var $thisListItem = $(this);

                var inputs = $thisListItem.find('input, select, textarea');
                inputs.each(function () {
                    var $thisInput = $(this);
                    if ($thisInput.attr('name').indexOf('[') != 0) { //don't append multiple times
                        $thisInput.attr('name', '[' + listItemIdx + '].' + $thisInput.attr('name'));
                    }
                });
            });

            //remove ones that are already done
            allListItems = allListItems.not(oneSetOfListItems);
        }
    }

    function doAjax(ajaxContent, silent) {

        //pull the data attributes of the element (generally data values take precedence over regular action and method attributes)
        var resultDestination = ajaxContent.data('result-destination') || ajaxContent; //default to itself
        var resultBehavior = ajaxContent.data('result-behavior') || 'replace';
        var additionalForms = ajaxContent.data('forms');
        var ajaxMethod = ajaxContent.data('method') || ajaxContent.attr('method') || 'get';
        var url = ajaxContent.data('url') || ajaxContent.attr('action');
        var refreshOnAjax = ajaxContent.data('refresh-onajax');

        //gather the data to send
        //find where we need to serialize from...use a boundary if it's found in the parent chain, otherwise itself
        var boundary = ajaxContent.data('boundary') != null ? ajaxContent : ajaxContent.parents('[data-boundary]');
        var toSerializeRoot = boundary.length > 0 ? boundary : ajaxContent;
        var requestData = ajaxContent.add(toSerializeRoot.find('form,input,select,textarea')).add(additionalForms).serialize();

        //make the ajax call
        $.ajax({
            url: url,
            type: ajaxMethod,
            data: requestData,
            statusCode: {
                500: function () { settings.onAjaxError(); }
            }
        }).done(function (data) {

            var html = settings.json ? data[settings.jsonHtmlKey] : data;
            html = $(html);

            var refreshOnLoad = html.data('refresh-onload');

            function showHtml() {
                html.fadeIn(function () {
                    //focus the first non-hidden input
                    $(this).find('input').not('[type=hidden]').first().focus();
                });
            }

            var eventTarget = html; //target to trigger ajaxLoaded event on
            html.hide();

            var resultDestinationElement;
            if (resultDestination == 'parent-boundary') {
                resultDestinationElement = ajaxContent.parents('[data-boundary]');
            } else {
                resultDestinationElement = $(resultDestination);
            }

            if (resultBehavior == 'append') {
                resultDestinationElement.append(html);
                showHtml();
                eventTarget.trigger('ajaxLoaded', [html]);
            }
            else if (resultBehavior == 'replace') {
                var oldHeight = resultDestinationElement.height();

                if (html == null || html.length == 0) {
                    //special case if the result destination will be replaced with nothing
                    //(i.e. a delete), we will have no element to trigger ajaxLoaded on.
                    //So we just use the next best choice: parent of the destination
                    eventTarget = resultDestinationElement.parent();

                    resultDestinationElement.fadeOut(function () {
                        resultDestinationElement.remove();
                        eventTarget.trigger('ajaxLoaded', [html]);
                    });
                }
                else {
                    if (silent) {
                        //silent...just do a simple replace, no fancy opacity or height manipulations
                        html.show();
                        resultDestinationElement.replaceWith(html);
                    }
                    else {
                        $('body').height($('body').height() + 1000); //helps smooth out dom manipulations at the bottom of the page

                        //add the new content to the dom (still hidden)
                        resultDestinationElement.replaceWith(html);

                        //get its height
                        var newHeight = html.height();
                        //set its height to the old value to start animation
                        html.height(oldHeight);
                        //show it
                        showHtml();
                        //animate to new height
                        html.height(newHeight);
                        //set height to auto so things don't get hidden with the overflow: hidden
                        setTimeout(function () { html.css('height', ''); }, 500);

                        $('body').height('auto'); //reset the height that was fiddled with at the top
                    }

                    eventTarget.trigger('ajaxLoaded', [html]);
                }
            }

            $(refreshOnAjax).add(refreshOnLoad).pepperAjax('refresh', {silent: true});
        });
    }

    var methods = {
        init: function (content, options) {
            
            settings = $.extend({
                onAjaxError: function () { alert('We were unable to process your request at this time.'); },
                json: false,
                jsonHtmlKey: 'html',
                prependInputIndexers: false
            }, options);

            content = content || $('body'); //default to everything

            content.thisAndChildren('[data-behavior=ajax]').each(function () {
                var $this = $(this);

                if ($this.prop("tagName") == "FORM") {
                    $this.on('submit', function (e) {
                        e.preventDefault();

                        if (settings.prependInputIndexers) {
                            prependInputIndexers($this);
                        }
                        
                        doAjax($this);
                    });
                }
                else {
                    $this.on('click', function (e) {
                        e.preventDefault();
                        doAjax($this);
                    });
                }
            });

            content.thisAndChildren('[data-behavior=remove-self]').each(function () {
                var $this = $(this);
                var target = $this.data('target');

                $this.click(function (e) {
                    e.preventDefault();

                    //if target is set, search up the parents list for it
                    var toRemove = target != null ? $this.parents(target) : $this;
                    toRemove.fadeOut(function () { toRemove.remove(); });
                });
            });
        },
        refresh: function (options) {
            this.each(function () {
                var doSilentRefresh = options && options.silent;
                doAjax($(this), doSilentRefresh);
            });
        }
    };

    $.fn.pepperAjax = function (methodOrOptions) {
        var $thisElement = $(this);

        if (methods[methodOrOptions]) {
            //call a method if it was passed
            return methods[methodOrOptions].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof methodOrOptions === 'object' || !methodOrOptions) {
            //else default to init (assuming they also passed options)
            methods['init']($thisElement, methodOrOptions);
        } else {
            $.error('Method ' + methodOrOptions + ' does not exist.');
        }

        $thisElement.on('ajaxLoaded', function (e, newContent) {
            //initialize all of the ajax on new content
            methods['init'](newContent, methodOrOptions);
        });
    }
}(jQuery));

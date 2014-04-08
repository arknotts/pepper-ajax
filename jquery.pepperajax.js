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

    function disableContent(content, disable) {
        if (disable) {
            content.addClass('ajax-loading');
        }
        else {
            content.removeClass('ajax-loading');
        }

        content.thisAndChildren('button, input[type=button], input[type=submit], a').each(function () {
            var $thisButton = $(this);
            $thisButton.prop('disabled', disable);

            //change font awesome icon to spinner (if it exists)
            var faIcon = $thisButton.find('i.fa');
            if (faIcon.length > 0) {
                if (disable) {
                    //store the old class so we can restore it later
                    faIcon.data('old-class', faIcon.prop('class'));
                    faIcon.removeClass().addClass('fa fa-refresh fa-spin');
                }
                else {
                    //restore the original class
                    faIcon.removeClass().addClass(faIcon.data('old-class'));
                }
            }
        });
    }

    function doAjax(ajaxTrigger) {

        //pull the data attributes of the element (generally data values take precedence over regular action and method attributes)
        var resultDestination = ajaxTrigger.data('result-destination') || ajaxTrigger; //default to itself
        var resultBehavior = ajaxTrigger.data('result-behavior') || 'replace';
        var additionalForms = ajaxTrigger.data('forms');
        var ajaxMethod = ajaxTrigger.data('method') || ajaxTrigger.attr('method') || 'get';
        var url = ajaxTrigger.data('url') || ajaxTrigger.attr('action');
        var refreshOnAjax = ajaxTrigger.data('refresh-onajax');

        var beforeAjaxEvent = $.Event("ajax");
        ajaxTrigger.trigger(beforeAjaxEvent);

        //gather the data to send
        //find where we need to serialize from...use a boundary if it's found in the parent chain, otherwise itself
        var boundary = ajaxTrigger.data('boundary') != null ? ajaxTrigger : ajaxTrigger.parents('[data-boundary]');
        var toSerializeRoot = boundary.length > 0 ? boundary : ajaxTrigger;
        var requestData = ajaxTrigger.add(toSerializeRoot.find('form,input,select,textarea')).add(additionalForms).serialize();
        
        if (!beforeAjaxEvent.isDefaultPrevented()) {
            if (settings.disableButtonsOnAjax) {
                disableContent(ajaxTrigger, true);
            }

            //make the ajax call
            $.ajax({
                url: url,
                type: ajaxMethod,
                data: requestData,
                dataType: 'html',
                statusCode: {
                    500: function () { settings.onAjaxError(); }
                }
            }).done(function (data) {

                ajaxTrigger.trigger('ajaxDone', [data]);

                var html = settings.json ? data[settings.jsonHtmlKey] : data;
                html = $(html);
                html.css('opacity', '0');

                function showHtml() {
                    setTimeout(function () { html.css('opacity', ''); }, 0);
                }

                var refreshOnLoad = html.data('refresh-onload');

                var resultDestinationElement = resultDestination == 'parent-boundary' ? ajaxTrigger.parents('[data-boundary]') : $(resultDestination);
                var resultDestinationParent = resultDestinationElement.parent();

                if (resultBehavior == 'append') {
                    resultDestinationElement.append(html);
                    showHtml();
                }
                else if (resultBehavior == 'replace') {
                    var oldHeight = resultDestinationElement.height();

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

                html.find('input').not('[type=hidden]').first().focus();
                html.trigger('ajaxLoaded');

                if (html.length == 0) { //no content returned, trigger it on parent element
                    resultDestinationParent.trigger('domChanged');
                }
                else {
                    html.trigger('domChanged');
                }

                if (settings.disableButtonsOnAjax) {
                    disableContent(ajaxTrigger, false);
                }

                $(refreshOnAjax).add(refreshOnLoad).pepperAjax('refresh', { silent: true });
            });
        }
    }

    var methods = {
        init: function (content, options) {
            
            settings = $.extend({
                onAjaxError: function () { alert('We were unable to process your request at this time.'); },
                json: false,
                jsonHtmlKey: 'html',
                prependInputIndexers: false,
                disableButtonsOnAjax: true
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
                    toRemove.fadeOut(function () {
                        var parent = toRemove.parent();
                        toRemove.remove();
                        parent.trigger('domChanged');
                    });
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
            methods['init']($(e.target), methodOrOptions);
        });
    }
}(jQuery));

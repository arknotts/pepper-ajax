(function ($) {
    //helper function
    $.fn.thisAndChildren = function (selector) {
        return this.filter(selector).add(this.find(selector));
    };

    var settings;


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
        var resultDestination = ajaxTrigger.data('result-destination') || ajaxTrigger.closest('select').data('result-destination') || ajaxTrigger; //default to itself
        var resultBehavior = ajaxTrigger.data('result-behavior') || ajaxTrigger.closest('select').data('result-destination') || 'replace';
        var additionalInputs = ajaxTrigger.data('additional-inputs') || ajaxTrigger.closest('select').data('additional-inputs');
        var ajaxMethod = ajaxTrigger.data('method') || ajaxTrigger.attr('method') || ajaxTrigger.closest('select').data('method') || 'get';
        var url = ajaxTrigger.data('url') || ajaxTrigger.attr('action') || ajaxTrigger.closest('select').data('url');
        var refreshOnAjax = ajaxTrigger.data('refresh-onajax') || ajaxTrigger.closest('select').data('refresh-onajax');
        
        var beforeAjaxEvent = $.Event("ajax");
        ajaxTrigger.trigger(beforeAjaxEvent);

        //gather the data to send
        //find where we need to serialize from...use a boundary if it's found in the parent chain, otherwise itself
        var boundary;
        if (ajaxTrigger.prop('tagName') == 'FORM') {
            boundary = ajaxTrigger; //always use the form if it's being submitted
        }
        else {
            //use itself if it's a boundary otherwise use the closest boundary
            boundary = ajaxTrigger.data('boundary') != null ? ajaxTrigger : ajaxTrigger.closest('[data-boundary]');
        }

        var toSerializeRoot = boundary.length > 0 ? boundary : ajaxTrigger;
        toSerializeRoot = toSerializeRoot.clone();

        if (ajaxMethod.toLowerCase() == 'get') {
            toSerializeRoot.find('[data-boundary]').remove();
        }

        var requestData = toSerializeRoot.find('input,select,textarea');

        //set prefixes of form elements if parent prefix exists on boundary
        requestData.each(function () {
            var $thisInput = $(this);
            var prefix = boundary.data('prefix');
            if (prefix != null) {
                $thisInput.attr('name', $thisInput.attr('name').replace(prefix + '.', ''));
            }
        });

        if (ajaxMethod.toLowerCase() == 'get') {
            requestData = requestData.filter('[data-for-get-request]'); //only filter automatic input inclusion
        }

        requestData = requestData.add(additionalInputs);

        if (!beforeAjaxEvent.isDefaultPrevented() && url != null) {  //make sure it hasn't been prevented and we have a url to go to
            if (settings.disableButtonsOnAjax) {
                disableContent(ajaxTrigger, true);
            }

            //make the ajax call
            $.ajax({
                url: url,
                type: ajaxMethod,
                data: requestData.serialize(),
                dataType: 'html',
                statusCode: {
                    500: function () { settings.onAjaxError(); }
                }
            }).done(function (data) {

                ajaxTrigger.trigger('ajaxDone', [data]);

                var html = settings.json ? data[settings.jsonHtmlKey] : data;
                html = $($.trim(html));
                html.css('opacity', '0');

                function showHtml() {
                    setTimeout(function () { html.css('opacity', ''); }, 0);
                }

                var refreshOnLoad = html.data('refresh-onload');

                var resultDestinationElement = resultDestination == 'parent-boundary' ? ajaxTrigger.parents('[data-boundary]') : $(resultDestination);
                var resultDestinationParent = resultDestinationElement.parent();

                if (resultBehavior == 'append' || resultBehavior == 'empty-append') {
                    if (resultBehavior == 'empty-append') {
                        resultDestinationElement.empty();
                    }
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

                //prepend the prefix (if any) to the new elements
                var prefix = html.parent().closest('[data-prefix]').data('prefix');
                if (prefix != null) {
                    html.each(function () {
                        var $thisHtml = $(this);
                        $thisHtml.thisAndChildren('input, select, textarea, [data-prefix]').each(function () {
                            var $thisElement = $(this);
                            var thisName = $thisElement.data('prefix') || $thisElement.attr('name');
                            var separator = thisName.indexOf('[') == 0 ? '' : '.'; //don't use dot if it immediately is followed by an index

                            var newName = prefix + separator + thisName;
                            if ($thisElement.data('prefix') != null) {
                                $thisElement.attr('data-prefix', newName).data('prefix', newName);
                            }
                            if ($thisElement.attr('name') != null) {
                                $thisElement.attr('name', newName);
                            }
                        });
                    });
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
                disableButtonsOnAjax: true
            }, options);

            content = content || $('body'); //default to everything

            content.thisAndChildren('[data-behavior=ajax]').each(function () {
                var $this = $(this);

                var tagName = $this.prop("tagName");
                if (tagName == "FORM") {
                    $this.on('submit', function (e) {
                        e.preventDefault();

                        doAjax($this);
                    });
                }
                else if (tagName == "SELECT") {
                    $this.on('change', function (e) {
                        e.preventDefault();
                        var selectedOption = $this.find('option:selected');

                        doAjax(selectedOption);
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

        return this;
    }
}(jQuery));

(function ($) {
    //helper function
    $.fn.thisAndChildren = function (selector) {
        return this.filter(selector).add(this.find(selector));
    };

    $.fn.pepperAjax = function (options) {
        var $thisElement = $(this);

        var settings = $.extend({
            onAjaxError: function () { alert('We were unable to process your request at this time.'); },
            json: false,
            jsonHtmlKey: 'html'
        }, options);

        function initContent(content) {
            content = content || $('body'); //default to everything
            
            content.thisAndChildren('[data-behavior=ajax]').each(function () {
                var $this = $(this);
                var resultDestination = $this.data('result-destination') || $this; //default to itself
                var resultBehavior = $this.data('result-behavior') || 'replace';
                var additionalForms = $($this.data('forms'));
                var ajaxMethod = 'get';
                var url;

                function callback(e) {
                    e.preventDefault();

                    //gather the data
                    var requestData = $this //include itself
                               .add($this.parents('form')) //include its parent form
                               .add(additionalForms) //include any additional forms listed
                               .serialize(); //serialize them all together

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
                            resultDestinationElement = $this.parents('[data-behavior=boundary]');
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

                            if (html.length == 0) {
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

                                eventTarget.trigger('ajaxLoaded', [html]);
                            }
                        }


                    });
                }

                //data-method overrides the default
                if ($this.data('method') != null) {
                    ajaxMethod = $this.data('method');
                }

                if ($this.prop("tagName") == "FORM") {
                    url = $this.attr('action');
                    if ($this.attr('method') != null) {
                        ajaxMethod = $this.attr('method');
                    }

                    $this.on('submit', function (e) {
                        var $thisForm = $(this);

                        //add the list-item indexers on form submit
                        var allListItems = $thisForm.find('[data-behavior=list-item]');

                        while (allListItems.length > 0) {
                            var first = allListItems.first();
                            var oneSetOfListItems = first.add(first.siblings('[data-behavior=list-item]'));

                            oneSetOfListItems.each(function (listItemIdx) {
                                var $thisListItem = $(this);

                                var inputs = $thisListItem.find('input, select, textarea');
                                inputs.each(function () {
                                    var $thisInput = $(this);
                                    $thisInput.attr('name', '[' + listItemIdx + '].' + $thisInput.attr('name'));
                                });
                            });

                            //remove ones that are already done
                            allListItems = allListItems.not(oneSetOfListItems);
                        }

                        callback(e);
                    });
                }
                else {
                    url = $this.attr('data-url');

                    $this.on('click', callback);
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
        }

        initContent($thisElement);

        $thisElement.on('ajaxLoaded', function (e, newContent) {
            //initialize all of the ajax on new content
            initContent(newContent);
        });
    }
}(jQuery));
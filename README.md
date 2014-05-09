pepper-ajax
===========

Ajaxify your page by peppering it with HTML5 data attributes
-----------

## A simple example - AJAX Form

```HTML
<div id="myList">
</div>

<form action="/NewListItem" data-behavior="ajax" data-result-destination="#myList" data-result-behavior="append">
  <button type="submit">Add Item</button>
</form>
```

By decorating the form with data-behavior="ajax", it tells pepperAjax to treat this form as an ajax form. The data-result-destination tells it where to put the result, and data-result-behavior tells it what to do with the result (in this case append it to #myList). Assuming the ```/NewListItem``` URL returns HTML such as ```HTML <div class="listItem">One Item</div>```, the result of clicking the "Add Item" button would be:

```HTML
<div id="myList">
  <div class="listItem">One Item</div>
</div>
```

## AJAX Button

```HTML
<button type="button" data-behavior="ajax" data-url="/UrlToContent">Load Content</button>
```

When clicked, this button replaces itself with content from /UrlToContent. NOTE: ```data-url``` is required for buttons.

## AJAX Select List

```HTML
<select data-behavior="ajax" data-result-destination="#content">
  <option value="blue" data-url="/cars?color=blue">Blue Cars</option>
  <option value="red" data-url="/cars?color=red">Red Cars</option>
</select>

<div id="content"></div>
```

Pepper ajax will make the ajax call when a change event fires for the select list. Data attributes listed on the ```<select>``` node apply to all options unless it is overridden on the ```<option>``` itself.

## How Pepper AJAX Gathers Request Data
Pepper AJAX will try to automatically gather the data to send in its AJAX request. Often this is sufficient, but you can help it find the data by using boundaries to define "areas" of data. A boundary is a DOM element which encapsulates a related set of form elements.

#### For AJAX Forms
AJAX forms are submitted with all inputs, selects, and textareas contained within them.

#### For Other AJAX Elements (buttons, selects, etc.)
Other AJAX elements look for a boundary to help gather data to submit. Mark a parent element with the ```data-boundary``` attribute and Pepper AJAX will gather all inputs, selects, and textareas within this boundary to submit.

#### A Note on GET Requests
If your AJAX request is sent via HTTP GET, Pepper AJAX will not include form elements unless they are marked with the ```data-for-get-request``` attribute. Additionally, Pepper AJAX will not look into child boundaries. Manually specify any additional elements you wish to include using the ```data-additional-inputs``` attribute.

#### Manually including additional data
Use the ```data-additional-inputs``` attribute to include additional form fields not automatically gathered by Pepper AJAX.

## Using Prefixes

TODO

## Refreshing Other Page Content

If your AJAX request modifies data server side that needs reflected in the browser, you can tell Pepper AJAX what DOM elements to refresh in response to an AJAX call. First, make sure the content you wish to refresh has the ```data-url``` attribute defined. The specified URL should return the refreshed content.

#### Proactive Content Refreshing

If you know what content needs refreshed in response to an AJAX call ahead of time, list that content in the ```data-refresh-onajax``` attribute of your AJAX element.

#### Reactive Content Refreshing

If you only know what content needs refreshed after an AJAX call is finished, use the ```data-refresh-onload``` attribute on the **root** element of the response.

## Available Data Attributes
 - **data-behavior=**
  - ```ajax```: Enables AJAX communication for a DOM element
 - **data-result-destination=**
  - ```[jQuery selector]```: A jQuery selector that tells pepperAjax where to put the result of the AJAX call
  - default: The same DOM element that triggers the AJAX
 - **data-result-behavior=**: Instructs pepperAjax how to add the result to the DOM
  - ```replace``` (default): Replaces the result destination with the AJAX result
  - ```append```: Appends the AJAX result to the result destination
 - **data-additional-inputs=**
  - ```[jQuery selector]```: A jQuery selector that specifies other forms/inputs to include in the AJAX call
 - **data-method=**
  - ```get```: Tells pepperAjax to use an HTTP GET when making the AJAX call
  - ```post```: Tells pepperAjax to use an HTTP POST when making the AJAX call
  - default: The ```method``` attribute of a form, or GET if not specified
 - **data-url=**
  - ```[URL]```: Tells pepperAjax what URL to make the AJAX call to. Required unless an action is already specified on the form
 - **data-boundary**
  - Defines a boundary for pepperAjax when it is gathering data to send for the AJAX call. Boundaries prevent pepperAjax from gathering too much data.

## Options

TODO

## Events

 - ```ajax```: Triggered before Pepper AJAX makes the AJAX request. Use ```e.target``` to get the ajax element. Use e.preventDefault() to prevent the request from being submitted. This is often used for validation.
 - ```ajaxDone```: Triggered when an AJAX request successfully finishes, but before the response is added to the DOM. One additional parameter ```data``` is passed to the callback function which is the raw data returned from the AJAX call.
 - ```ajaxLoaded```: Triggered after the response is added to the DOM. Listen for this event to initialize newly-loaded HTML. Use ```e.target``` to get the newly-added HTML from the AJAX call.
 - ```domChanged```: Triggered any time Pepper AJAX makes modifications to the DOM. Use ```e.target``` to get the content that changed.



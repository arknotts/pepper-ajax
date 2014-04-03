pepper-ajax
===========

Ajaxify your page by peppering it with HTML5 data attributes
-----------

### A simple example

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

### Available Data Attributes
 - **data-behavior=**
  - ```ajax```: Enables AJAX communication for a DOM element
 - **data-result-destination=**
  - ```[jQuery selector]```: A jQuery selector that tells pepperAjax where to put the result of the AJAX call
  - default: The same DOM element that triggers the AJAX
 - **data-result-behavior=**: Instructs pepperAjax how to add the result to the DOM
  - ```replace``` (default): Replaces the result destination with the AJAX result
  - ```append```: Appends the AJAX result to the result destination
 - **data-forms=**
  - ```[jQuery selector]```: A jQuery selector that specifies other forms/inputs to include in the AJAX call
 - **data-method=**
  - ```get```: Tells pepperAjax to use an HTTP GET when making the AJAX call
  - ```post```: Tells pepperAjax to use an HTTP POST when making the AJAX call
  - default: The ```method``` attribute of a form, or GET if not specified
 - **data-url=**
  - ```[URL]```: Tells pepperAjax what URL to make the AJAX call to. Required unless an action is already specified on the form

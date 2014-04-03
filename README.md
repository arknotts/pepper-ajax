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

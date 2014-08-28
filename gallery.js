/*
File: gallery.js
Description: Evothings Gallery JavaScript code.
Author: Eric Svensson
Copyright (c) 2013-2014 Evothings AB
*/

;$(function() {

	if ($.QueryString['etc'])
		$('body').addClass('etc')

	$.getJSON("gallery.json", function(data) {

		var $list = $("#list")
		var $listItemTemplate = $("#list_item_template")
		var $resourceTemplate = $("#list_item_template .resource")

		$.each(data.items, function(key, item) {

			/*  If the query string specifies that only items with certain
				tags should be shown and the current item doesn't contain those
				tags then continue to the next item. */
			if (item.tags && $.QueryString["showtags"] &&
				($.arrayIntersect(
					item.tags.split(','),
					$.QueryString["showtags"].split(','))
				).length == 0)
				return true // same as 'continue' in a native JS loop

			/*  If the query string specifies that only items lacking certain
				tags should be shown and the current item contains one or more
				of those tags then continue to the next item. */
			if (item.tags && $.QueryString["hidetags"] &&
				($.arrayIntersect(
					item.tags.split(','),
					$.QueryString["hidetags"].split(','))
				).length > 0)
				return true // same as 'continue' in a native JS loop

			var $newItem = $listItemTemplate
				.clone()
				.appendTo($list)
				.attr("id", "")
				.addClass("visible")

			/*  If supplying the 'etc' querystring, e.g. when
				navigating from Evothings Client, change http:// or https:// to
				evothings:// in the app URL so that the apps open in the
				Evothings Client app. */
			if (item.url && $.QueryString["etc"])
				item.url = item.url.replace(/https?:\/\//, 'evothings://')

			$newItem
				.children("a.screenshot")
					.attr("href", item.url)
					.children("img")
						.attr("src", item.image)
						.attr("alt", item.description)
						.end()
					.children("div.description")
						.text(item.description)
						.end()

			$newItem
				.find(".author")
				.text(item.author)

			if (item.links)
				$.each(item.links, function(resourceKey, resourceVal) {
					$newItem.append(
						$resourceTemplate
							.clone()
							.addClass("resource-" + resourceKey)
							.attr("href", resourceVal)
							.text(resourceKey)
							.show()
					)
				})
		})

	}).fail(function() {
		alert('Failed to load gallery.')
	})

})

/* jQuery plug-in that parses the URL Query String.
   Usage example: get the query string parameter named "param" through
   $.QueryString["param"] */
;(function($) {
	$.QueryString = (function(a) {
		if (a == "") return {}
		var b = {}
		for (var i = 0; i < a.length; ++i)
		{
			var p = a[i].split('=')
			if (p.length != 2) continue;
			b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "))
		}
		return b;
	})(window.location.search.substr(1).split('&'))
})(jQuery)

/* jQuery plug-in that produces the intersection between the two input arrays. */
;(function($) {
	$.arrayIntersect = function(a, b)
	{
		return $.grep(a, function(i)
		{
			return $.inArray(i, b) > -1
		})
	};
})(jQuery)

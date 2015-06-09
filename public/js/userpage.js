$(document).ready(function() {

	var fileControl = new FileControl();

	$('#files').sortable();
	$('.file').disableSelection();
	$('#breadcrumbs').html(decodeURI(document.location.pathname).substring(1).split('/').join('<img class="crumb" src="/public/img/arrow.png">'));


	$('.file[type=folder]').dblclick(function() {
		fileControl.changeDir($(this).find('.file-name').text());
	});


	$('.file[type=file]').click(function() {
		var selected = $(this).get(0);
		$('.file').each(function() {
			if ($(this).hasClass('toggle') && $(this).get(0) != selected)
				$(this).removeClass('toggle'); 
		});
		$(this).toggleClass('toggle');
		$('.download').show('slide', 'fast');

		$('.download').attr('data', $(this).find('.file-name').text());
	});

	$('body').click(function(event) {
		if (event.target.className == '' || event.target.className == 'ui-sortable' && event.target.className != 'sidebar') {
			$('.file').each(function() {
				if ($(this).hasClass('toggle'))
					$(this).removeClass('toggle'); 
			});
			$('.download').hide('slide', 'fast');
		}
	});

	$('#open-folder').click(function() {
		document.location.href += "/" + $(this).attr('data');
	});

	$('.download').click(function() {
		var regExp = /\/users\/([\w\-\_]{3,20})([\/[\w|%|\s]+]*)*$/;
		var params = regExp.exec(document.location.pathname);
		var login, path = '';
		if (params[2] == undefined) {
			login = params[1];
			path = ''
		}
		else {
			path = params[2];
			login = params[1];
		}
		var filename = $(this).attr('data');
		document.location.href = '/downloadFile?path=' + path + '&type=file&filename=' + filename + '&login=' + login + '&page=user'; 
	});

var timeout;
	$('#search input').keyup(function() {
		var value = $(this).val();
		var pattern = new RegExp(value, 'i');
		if (value != '') $('#search input').css('background', 'white url("/public/img/loader.gif") right center no-repeat');
		if (timeout) clearTimeout(timeout);

		timeout = setTimeout(function() {
			if (value == '') {
				$('.file').each(function () {
					$(this).show('fast');
				});
			}
			else {
				$('.file').each(function () {
					var filename = $(this).find('.file-name').text();
					if (!pattern.test(filename)) {
						$(this).hide('fast');
					}
					else {
						$(this).show('fast');
					}
				});
			}
			$('#search input').css('background', 'none');
		}, 200);
	});

});
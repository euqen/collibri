$(document).ready(function() {

	var fileControl = new FileControl();
	var files = $('.files');

	$('#files').sortable();
	$('.file').disableSelection();


	var url = decodeURI(document.location.pathname);
	var crumbs = url.substr(1).split('/');
	var pre = '';
	var result = '';
	console.log(crumbs);
	crumbs.forEach(function(crumb) {
		pre += '/' + crumb;
		result += '<a href="' + pre + '">' + crumb + '</a><img class="crumb" src="/public/img/arrow.png">';
	});

	result = result.substr(0, result.length - 47);

	$('#breadcrumbs').html(result);

	var toggleSidebarAreas = function (hide1, hide2, show)
	{
		show.show();
		hide1.hide();
		hide2.hide();
		hide1.css({marginLeft: 180});
		hide2.css({marginLeft: 180});
		show.animate({marginLeft: 0}, 'fast');
	}

	/*
	* FILE CLICK EVENT EMITTER
	* AFTER FILE CLICK SHOW:
	* 1. SIDEBAR FILE OF FOLDER ZONE WITH SLIDING UP IT.
	* 2. BACKGROUND BEFORE FILE CLICKING AREA
	*/

	$('body').delegate('.file', 'click', function() {
		var selected = $(this).get(0);
		$('.file').each(function() {
			if ($(this).hasClass('toggle') && $(this).get(0) != selected)
				$(this).removeClass('toggle'); 
		});
		$(this).toggleClass('toggle');

		$('#file-area #delete').attr('data', $(this).find('.file-name').text());
		$('#file-area #delete').attr('type', $(this).attr('type'));

		$('#file-area .general').attr('type', $(this).attr('type'));
		$('#file-area .general').attr('data', $(this).find('.file-name').text());

		$('#file-area #rename').attr('data', $(this).find('.file-name').text());
		$('#file-area #rename').attr('type', $(this).attr('type'));

		$('#file-area #downl').attr('data', $(this).find('.file-name').text());
		$('#file-area #downl').attr('type', $(this).attr('type'));

		var eyeClass = '';
		var eyeMessage = '';
		if ($(this).find('.eye').attr('class') == 'glyphicon glyphicon-eye-open eye') {
			eyeMessage = '   Make this file ungeneral';
			eyeClass = 'glyphicon glyphicon-eye-close'
		}
		else {
			eyeClass = 'glyphicon glyphicon-eye-open';
			eyeMessage = '   Make this file general';
		}

		$('#eye-toggle').attr('class', eyeClass);
		$('#eye-message').text(eyeMessage);

		$('#file-name').text($(this).find('.file-name').text());

		if($(this).attr('type') == 'folder') {
			$('#preview img').attr('src', '/public/img/PNG/folder.png');
			$('#open-folder').attr('data', $(this).find('.file-name').text());
			$('#file').hide();
			$('#folder').show();
		}
		else if($(this).attr('type') == 'file') {
			$('#preview img').attr('src', $(this).find('img').attr('src'));
			$('#folder').hide();
			$('#file').show();
		}

		toggleSidebarAreas($('#user-area'), $('#folder-area'), $('#file-area'));
	});

	$('body').delegate('.file[type=folder]', 'dblclick', function() {
		fileControl.changeDir($(this).find('.file-name').text());
	})

	$('body').click(function(event) {
		if (event.target.className == '' || event.target.className == 'ui-sortable' && event.target.className != 'sidebar') {
			$('.file').each(function() {
				if ($(this).hasClass('toggle'))
					$(this).removeClass('toggle'); 
				$(this).show('fast');
			});
			
		if (event.target.className != 'search-field') {
			$('#search input').val('');
		}

		toggleSidebarAreas($('#folder-area'), $('#file-area'), $('#user-area'));

		}
	});

	$('.upload').click(function() {
		$('.file-upload').click();
	});

	$('.file-upload').change(function() {
		fileControl.uploadFiles(this.files);
	});

	$('.new-folder').click(function() {
		toggleSidebarAreas($('#user-area'), $('#file-area'), $('#folder-area'));
		$('.input-folder').focus();
	});

	$('.create-new-folder').click(function() {
		var folderName = $('.input-folder').val();
		var pattern = new RegExp('^[ ]+$', 'i');
		if (!pattern.test(folderName)) {
			fileControl.createFolder(folderName);
			toggleSidebarAreas($('#folder-area'), $('#file-area'), $('#user-area'));
		}
		else {
			$('#errors').fadeOut('500');
			$('#errors #alert-message').text('Ooops! Incorrect foldername!');
			$('#errors').fadeIn('500');
		}
	});

	$('#file-area #delete').click(function() {
		fileControl.deleteFile($(this).attr('data'), $(this).attr('type'));
	});


	$('#open-folder').click(function() {
		document.location.href += "/" + $(this).attr('data');
	});


	getPath = function (params) {
		var path = '';
		if (params != '/home') path = params.substr(5, params.length - 1);
		return path;
	}

	$('#downl').click(function() {
		var path = getPath(document.location.pathname);
		document.location.href = '/downloadFile?path=' + path + '&type=' + $(this).attr('type') + '&filename=' + $(this).attr('data') + '&page=home';

	});

	$('.general').click(function() {
		fileControl.general($(this).attr('data'), $(this).attr('type'));
	});

	$('.dropdown-toggle').dropdown();

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

	$('#file-area #rename').click(function () {
		var type = $(this).attr('type');
		var filename = $(this).attr('data');
		$("#file-name").html('<input class="form-control" id="rename-input" value="' + $(this).attr('data') + '" />');
		$('#rename-input').focus();
	
		$('#rename-input').focusout(function() {
			if ($(this).val() != filename) fileControl.rename(filename, type, $(this).val());
		});

	});

});
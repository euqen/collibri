function FileControl()
{
	this.files = [];
	var control = this;

	this.addFiles = function (files)
	{
		$.each(files, function(index, file) {
			var now = new Date();
			var today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
			
			var temp = {file: file, loaded: 0, total: 0, date: today, element: null, valid: false};
			if (file.size / 1024 / 1024 < 500) control.files.unshift(temp)
			else $('#errors').append('<div class="alert alert-danger" role="alert">File ' + file.name + 'can not be more than 500 MB.</div>');
		});
	};

	this.uploadFiles = function (selectedfiles)
	{
		control.addFiles(selectedfiles);
		$.each(control.files, function (index, file) {
			var data = new FormData();
			var extname = file.file.name.split('.').pop();
			data.append('filename', file.file.name);
			data.append('hash', null);
			data.append('extname', extname);
			data.append('path', decodeURI(document.location.pathname));
			data.append("size", file.file.size);
			data.append("date", file.date);
			data.append('fileUpload', file.file);
			$.ajax({
				url: '/uploadFile',
				type: 'POST',
				data: data,
				cache: false,
				contentType: false,
				processData: false,
				beforeSend : function() {
					var newFile = "<div class='file ui-sortable-handle' type='file' style='display:none' id='new'><div class='file-preview'><img class='image' src='/public/img/PNG/no.png' width='50' height='50' /><div class='general-eye'><span aria-hidden='true' class='glyphicon glyphicon-eye-close eye'></span></div></div><div class='file-name'>" + file.file.name + "</div><div class='progressbar'><progress name='" + file.file.name +"' value='0' max='100'></progress></div><div class='file-add-time'></div></div>";
					$('.no-uploads-message').hide('300').remove();
					$('#files').append(newFile);
					file.element = $('#new');
					$('#new').removeAttr('id').show('300');
				},
				xhr: function() {
					var xhr = $.ajaxSettings.xhr();
					xhr.upload.onprogress = function(event) {
						file.loaded = event.loaded;
						file.total = event.total;
						control.updateProgressBar(file.loaded, file.total, file.element);
					}
					return xhr;
				}
			})
			.done(function(response) {
				file.element.find('progress').hide('300').remove();
				file.element.find('.file-add-time').text('Just now').show('300');
				var extname = file.file.name.split('.').pop();
				file.element.find('.image').attr('src', '../public/img/PNG/no.png');
			})
			.fail(function(response) {
				file.element.hide('300').remove();
				control.errorHandler(response.responseText);
			});
		});
	};

	this.updateProgressBar = function (loaded, total, file)
	{
		var progressBar = file.find('progress');
		progressBar.attr('value', Math.floor(loaded * 100 / total));
	};

	this.errorHandler = function (message) 
	{
		$('#errors').fadeOut('500');
		if (message) {
			$('#errors #alert-message').text(message);
			$('#errors').fadeIn('500');
		}
	};

	this.toggleSidebarAreas = function (hide1, hide2, show)
	{
		show.show();
		hide1.hide();
		hide2.hide();
		hide1.css({marginLeft: 180});
		hide2.css({marginLeft: 180});
		show.animate({marginLeft: 0}, 'fast');
	};

	this.createFolder = function (foldername)
	{
		$.ajax({
			url: '/createFolder',
			type: 'POST',
			data: {filename: foldername, path: decodeURI(document.location.pathname)},
			dataType: 'json'
		})
		.done(function(response) {
			var newFile = "<div class='file ui-sortable-handle' type='folder' style='display:none' id='new'><div class='file-preview'><img class='image' src='/public/img/PNG/folder.png' width='50' height='50' /><div class='general-eye'><span aria-hidden='true' class='glyphicon glyphicon-eye-close eye'></span></div></div><div class='file-name'>" + foldername + "</div><div class='file-add-time'>Just now</div></div>";
			$('.no-uploads-message').hide('300').remove();
			$('#files').append(newFile);
			$('#new').removeAttr('id').show('300');
		})
		.fail(function(response) {
			control.errorHandler(response.responseText);
		})
		.always(function() {
			control.toggleSidebarAreas($('#folder-area'), $('#file-area'), $('#user-area'));
		});
	};

	this.deleteFile = function (filename, type)
	{
		$.ajax({
			url: '/deleteFile',
			type: 'POST',
			data: {filename: filename, path: decodeURI(document.location.pathname), type: type},
			dataType: 'json'
		})
		.done(function(response) {
			$('.file').each(function() {
				if ($(this).find('.file-name').text() == filename && $(this).attr('type') == type) {
					$(this).hide(300).remove();
				}
			});
		})
		.fail(function(response) {
			control.errorHandler(response.responseText);
		})
		.always(function() {
			control.toggleSidebarAreas($('#folder-area'), $('#file-area'), $('#user-area'));
		});
	};

	this.changeDir = function (dir)
	{
		var ref = document.location.href;
		if (ref[ref.length] == '/') document.location.href = ref + dir;
		else document.location.href = ref + '/' + dir;
	};

	this.general = function (filename, type)
	{
		$.ajax({
			url: '/general',
			type: 'POST',
			dataType: 'json',
			data: {filename: filename, type: type, path: decodeURI(document.location.pathname)},
		})
		.done(function(response) {
			$('.file').each(function() {
				if ($(this).find('.file-name').text() == filename) {
					$(this).find('.general-eye span').attr('class', response.result ? 'glyphicon glyphicon-eye-open eye' : 'glyphicon glyphicon-eye-close eye');
				}
			});
		})
		.fail(function(response) {
			control.errorHandler(response.responseText);
		})
		.always(function() {
			control.toggleSidebarAreas($('#folder-area'), $('#file-area'), $('#user-area'));
		});
	};

	this.rename = function(filename, type, rename)
	{
		$.ajax({
			url: '/rename',
			type: 'POST',
			dataType: 'json',
			data: {filename: filename, rename: rename, type: type, path: decodeURI(document.location.pathname)},
		})
		.done(function(response) {
			$('.file').each(function() {
				if ($(this).find('.file-name').text() == filename && $(this).attr('type') == type) {
					$(this).find('.file-name').text(rename);
				}
			});
		})
		.fail(function(response) {
			control.errorHandler(response.responseText);
		})
		.always(function() {
			control.toggleSidebarAreas($('#folder-area'), $('#file-area'), $('#user-area'));
		});
	};
}
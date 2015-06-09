	$('body').delegate('.user .add button', 'click', function() {

		var login = $(this).parent().parent().find('.login').text();
		var action = $(this).attr('action');
		var avatar = $(this).parent().parent().find('.avatar img').attr('src');
		var fullname = $(this).parent().parent().find('.fullname').text();
		var button = $(this);

		$.ajax({
			url: '/friendsActions',
			type: 'POST',
			dataType: 'json',
			data: {login: login, avatar: avatar, action: action, fullname: fullname}
		})
		.done(function() {
			button.attr('class', 'btn btn-success btn-xs add-btn').html('<span class="glyphicon glyphicon-ok-circle"></span>  Success');
		})
		.fail(function() {
			button.attr('class', 'btn btn-danger btn-xs add-btn').html('<span class="glyphicon glyphicon-remove-circle"></span>  Error');
		});
	});

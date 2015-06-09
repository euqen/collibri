$(document).ready(function() {
	$('.avatar').click(function() {
		$('.file').click();
	});

	$('#ava').hover(function() {
		$('.avatar').animate({'opacity': '0.5'}, 'fast');
		$('#ava .glyphicon').show('fast');
	}, function() {
		$('.avatar').animate({'opacity': '1'}, 'fast');
		$('#ava .glyphicon').hide('fast');
	});


	$('.file').change(function () {
		$('#ava .glyphicon').attr('class', 'glyphicon glyphicon-ok-circle');
		$('#ava .glyphicon').show('fast');
	});


	var page = document.location.pathname;
	$('a[href="' + page + '"]').parent().addClass('selected').append('<span class="glyphicon glyphicon-triangle-top selected-ico" aria-hidden="true"></span');

	$('.field').click(function() {
		document.location.href = $(this).find('a').attr('href');
	});


	var timeout;
	$('.searchfield').keyup(function() {
		$('.searchfield').css('background', 'white url("/public/img/loader.gif") right center no-repeat');
		if (timeout) clearTimeout(timeout);
		var value = $(this).val();

		if (value != '') {
			timeout = setTimeout(function() {
				$.ajax({
					url: '/search',
					type: 'POST',
					data: {value: value},
					dataType: 'json',
					beforeSend : function() {
						$('#found').empty();
					}
				})
				.done(function (response) {
					$('.searchfield').css('background', 'none');
					response.users.forEach(function (user) {
						var usr = '';
						for(i = 0; i < response.friends.length; i++) {
							if(response.friends[i].login == user.login && response.owner != user.login) {
								usr = "<div class='user'><div class='avatar'><img src='/public/avatars/" + user.avatar + "' width='35' height='35' class='img-circle' /></div><div class='login'><a href='/users/" + user.login + "'>" + user.login + "</a></div><div class='fullname'>" + (user.firstname || '') + " " +(user.lastname || '') +"</div><div class='add'><button type='button' class='btn btn-warning btn-xs add-btn' action='remove'>Remove from friends</button></div><div class='clear'></div></div>";
								break;
							}
						}
						if (!usr && response.owner != user.login) usr = "<div class='user'><div class='avatar'><img src='/public/avatars/" + user.avatar + "' width='35' height='35' class='img-circle' /></div><div class='login'>" + user.login + "</div><div class='fullname'>" + (user.firstname || '') + " " +(user.lastname || '') +"</div><div class='add'><button type='button' class='btn btn-primary btn-xs add-btn' action='add'>Add to friends</button></div><div class='clear'></div></div>";
						$('#found').append(usr);
					});
					if (!response.users.length || !$('#found').text()) $('#found').append('<h4 id="title" align="center">Ooops! Nothing find yet!</h4>');
				})
				.fail(function() {
					$('#found').append('<h4 id="title" align="center">Ooops! There are some problems with network connection!</h4>');
				});
			}, 1000);
		}
		else $('.searchfield').css('background', 'none');
	});

});
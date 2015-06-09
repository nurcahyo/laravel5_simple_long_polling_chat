(function() {
	'use strict';

	angular.module('home.config', [])
	.constant('BASE_ENDPOINT', 'http://chatty.dev/api/')
	.constant('LOGIN_URL', 'http://chatty.dev/api/auth/login')
	.constant('DEFAULT_HTTP_HEADERS', {
		'Content-Type': 'Application/json'
	});
}());

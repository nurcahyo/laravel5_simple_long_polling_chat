(function() {
	'use strict';

	angular.module('home.config', [])
	.constant('BASE_ENDPOINT', 'http://localhost:8000/api/')
	.constant('LOGIN_URL', 'http://localhost:8000/api/auth/login')
	.constant('DEFAULT_HTTP_HEADERS', {
		// 'Content-Type': 'Application/json'
	});
}());

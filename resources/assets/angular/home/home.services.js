(function() {
	'use strict';

	angular.module('home.services', 
		['ngResource', 'home.config'],
		['$provide', function($provide) {
			/**
			 * Authentication service provider
			 * @param  Object $http          Angular Http Provider
			 * @param  String loginEndpoint  Login Endpoint Constant. 
			 *                               @See resources/angular/home/home.config.js to change the value
			 * @return Object                Authentication Service
			 */
			$provide.service('AuthService', ['$http','LOGIN_URL', 
				function($http, loginEndpoint) {
					this.authenticate = function(credentials) {
						return $http.post(loginEndpoint, credentials);
					};
				}
			]);

			$provide.factory('MessagingService', ['$resource', '$http', 'BASE_ENDPOINT', 
				function($resource, $http, endPoint) {
					var actions;
					
					actions = {
						'query': {method: 'GET', isArray: false},
						'publish': {method: 'POST'}
					};

					return {
						resource: $resource(endPoint+'message', {}, actions),
						subscribe: function(params) {
							return $http({
								method: 'GET',
								url: endPoint+'message/subscribe',
								timeout: 1000*20,
								params: params
							});
						}
					};
				}
			]);
		}]
	);
}());
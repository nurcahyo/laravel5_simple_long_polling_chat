/**
 * Angular module for Home module
 */
(function() {
	'use strict';

	angular.module('home', [
		'ngRoute',
		'home.config',
		'home.controllers',
		'home.directives',
		'home.services'
	])
	.config([
		'$routeProvider','$locationProvider','$httpProvider', 'DEFAULT_HTTP_HEADERS',
		function($routeProvider, $locationProvider, $httpProvider, defaultHeaders) {
			var templatePath, httpHeaders;

			//Setup default http headers
			httpHeaders = $httpProvider.defaults.headers;
			$httpProvider.defaults.withCredentials = false;
		    //Set default headers from constants
		    for (var headerName in defaultHeaders) {
		      httpHeaders.common[headerName] = defaultHeaders[headerName];
		    }


			//Add ! to prefix
		    $locationProvider.hashPrefix('!');

		    //Set route & template path
			templatePath = window.location.pathname+'partials/';
			$routeProvider.when('/', {
				controller: 'HomeCtrl', 
				templateUrl: templatePath+'home.html'
			});
		}
	])
	.run(['$rootScope', function(scope) {
		scope.isGuest = true;
		scope.$user = {
			id: 0,
			email: null,
			login: function(id, email) {
				scope.isGuest = (id === 0);
				scope.$user.id = id;
				scope.$user.email = email;
			},
			logout: function() {
				scope.isGuest = true;
				scope.$user.id = 0;
				scope.$user.email = null;
			}
		};
	}]);
}());
(function() {
	'use strict';

	angular.module('home.config', [])
	.constant('BASE_ENDPOINT', 'http://chatty.dev/api/')
	.constant('LOGIN_URL', 'http://chatty.dev/api/auth/login')
	.constant('DEFAULT_HTTP_HEADERS', {
		'Content-Type': 'Application/json'
	});
}());

(function(){
	'user strict';

	angular.module('home.controllers', [])
		.controller('HomeCtrl', [
			'$scope', 'MessagingService',
			function(scope, messageService) {
				var messageQueryResponse, Message;
				Message = messageService.resource;
				scope.loadedKeyMap = [];
				scope.$parent.Page = {
					title: 'Chatty'
				};
				// Online users
				scope.users = [];

				// Messages
				scope.messages = [];
				scope.nextPageUrl = null;
				scope.currentPage = 1;
				scope.totalDisplayed = 0;
				var now = new Date();
				scope.firstLoadTime =  Math.floor((new Date(
						now.getUTCFullYear(),
					    now.getUTCMonth(),
					    now.getUTCDate(),
					    now.getUTCHours(),
					    now.getUTCMinutes(), 
					    now.getUTCSeconds()
					)).getTime() / 1000);
				scope.chat = {
					message: ''
				};

				scope.scrollToBottom = function() {
					setTimeout(function() {
						window.scrollTo(0, window.document.body.scrollHeight);
					},500);
				};

				scope.loadEarlier = function() {
					if (scope.currentPage === 1 || scope.nextPageUrl !== null) {
						messageQueryResponse = Message.query({page: scope.currentPage, time_limit: scope.firstLoadTime}, function() {
							/**
							 * Push messages object
							 * @param  {Object} message) {id: 1, email: 'string', message: 'string': created_at: 'timestamp'}     message object
							 * @return {void}          
							 */
							
							messageQueryResponse.data.forEach(function(message) {
								scope.messages.unshift(message);
							});

							scope.totalDisplayed = messageQueryResponse.to;

							scope.nextPageUrl = messageQueryResponse.next_page_url;
							if (scope.currentPage === 1) {
								setTimeout(function() {
									window.scrollTo(0, window.document.body.scrollHeight);
								},500);
							}
							if (scope.nextPageUrl === null) {
								scope.currentPage = 1;
							} else {
								scope.currentPage++;
							}
						});
					}
				};

				//Init first page
				scope.loadEarlier();

				// Initial message value
				scope.sendMessage = function(message) {
					var newMessage;
					if (message.trim() !== "") {
						newMessage = new Message();
						newMessage.user_id= scope.$user.id;
						newMessage.message= message;
						newMessage.$publish(function(responseResource, responseHeader) {
							window.console.log(responseResource);
							newMessage.id = responseResource.id;
							newMessage.created_at = responseResource.created_at;
							scope.loadedKeyMap.push(newMessage.id);
						});
						newMessage.email= scope.$user.email;
						scope.messages.push(newMessage);
						scope.totalDisplayed++;
						scope.chat.message = '';
						scope.scrollToBottom();
					}
					return true;
				};
				now = new Date();
				var subscribeTimeLimit = Math.floor((new Date(
						now.getUTCFullYear(),
					    now.getUTCMonth(),
					    now.getUTCDate(),
					    now.getUTCHours(),
					    now.getUTCMinutes(), 
					    now.getUTCSeconds()
					)).getTime() / 1000);
				var subscribe = function() {
					messageService.subscribe({
						time_limit: subscribeTimeLimit
					})
						.success(function(response, status) {
							window.console.log(response);
							// REfresh time when success
							if (!!response.count && response.count > 0) {
								now = new Date();
								subscribeTimeLimit = Math.floor((new Date(
									now.getUTCFullYear(),
								    now.getUTCMonth(),
								    now.getUTCDate(),
								    now.getUTCHours(),
								    now.getUTCMinutes(), 
								    now.getUTCSeconds()
								)).getTime() / 1000);

								response.data.forEach(function(message) {
									console.log(scope.loadedKeyMap.indexOf(message.id), message, scope.loadedKeyMap);
									if (scope.loadedKeyMap.indexOf(message.id) === -1) {
										scope.loadedKeyMap.push(message.id);
										scope.messages.push(message);
										scope.totalDisplayed++;
										scope.scrollToBottom();
									}

								});
							}
							subscribe();
						})
						.error(function(response, status) {
							window.console.log(response);
						});
				};
				// Initial Run
				subscribe();
			}
		])
		.controller('LoginCtrl', [
			'$scope', 'AuthService',
			function(scope, auth) {
				scope.credentials = {
					email: "",
					password: ""
				};
				scope.loginInProgress = false;
				scope.authenticate = function(credentials) {
					if (!!credentials.email && !!credentials.password && !scope.loginInProgress) {
						scope.loginInProgress = true;
						auth.authenticate(credentials).success(function(response, status) {
							if (response.success) {
								scope.$user.login(response.data.id, response.data.email);
							}
							scope.loginInProgress = false;
						}).error(function(response, status) {
							scope.loginInProgress = false;
						});
					}
				};
			}
		]);

}());
(function(){
	'use strict';

	angular.module('home.directives', [])
	.directive('loginBox', [function() {
		return {
			restrict: 'AE',
			templateUrl: window.location.pathname+'partials/directive_login_box.html',
			replace: false,
			controller: 'LoginCtrl'
		};
	}]);
}());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhvbWUubW9kdWxlLmpzIiwiaG9tZS5jb25maWcuanMiLCJob21lLmNvbnRyb2xsZXIuanMiLCJob21lLmRpcmVjdGl2ZS5qcyIsImhvbWUuc2VydmljZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImhvbWUtYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBbmd1bGFyIG1vZHVsZSBmb3IgSG9tZSBtb2R1bGVcbiAqL1xuKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2hvbWUnLCBbXG5cdFx0J25nUm91dGUnLFxuXHRcdCdob21lLmNvbmZpZycsXG5cdFx0J2hvbWUuY29udHJvbGxlcnMnLFxuXHRcdCdob21lLmRpcmVjdGl2ZXMnLFxuXHRcdCdob21lLnNlcnZpY2VzJ1xuXHRdKVxuXHQuY29uZmlnKFtcblx0XHQnJHJvdXRlUHJvdmlkZXInLCckbG9jYXRpb25Qcm92aWRlcicsJyRodHRwUHJvdmlkZXInLCAnREVGQVVMVF9IVFRQX0hFQURFUlMnLFxuXHRcdGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJGh0dHBQcm92aWRlciwgZGVmYXVsdEhlYWRlcnMpIHtcblx0XHRcdHZhciB0ZW1wbGF0ZVBhdGgsIGh0dHBIZWFkZXJzO1xuXG5cdFx0XHQvL1NldHVwIGRlZmF1bHQgaHR0cCBoZWFkZXJzXG5cdFx0XHRodHRwSGVhZGVycyA9ICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycztcblx0XHRcdCRodHRwUHJvdmlkZXIuZGVmYXVsdHMud2l0aENyZWRlbnRpYWxzID0gZmFsc2U7XG5cdFx0ICAgIC8vU2V0IGRlZmF1bHQgaGVhZGVycyBmcm9tIGNvbnN0YW50c1xuXHRcdCAgICBmb3IgKHZhciBoZWFkZXJOYW1lIGluIGRlZmF1bHRIZWFkZXJzKSB7XG5cdFx0ICAgICAgaHR0cEhlYWRlcnMuY29tbW9uW2hlYWRlck5hbWVdID0gZGVmYXVsdEhlYWRlcnNbaGVhZGVyTmFtZV07XG5cdFx0ICAgIH1cblxuXG5cdFx0XHQvL0FkZCAhIHRvIHByZWZpeFxuXHRcdCAgICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCchJyk7XG5cblx0XHQgICAgLy9TZXQgcm91dGUgJiB0ZW1wbGF0ZSBwYXRoXG5cdFx0XHR0ZW1wbGF0ZVBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUrJ3BhcnRpYWxzLyc7XG5cdFx0XHQkcm91dGVQcm92aWRlci53aGVuKCcvJywge1xuXHRcdFx0XHRjb250cm9sbGVyOiAnSG9tZUN0cmwnLCBcblx0XHRcdFx0dGVtcGxhdGVVcmw6IHRlbXBsYXRlUGF0aCsnaG9tZS5odG1sJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRdKVxuXHQucnVuKFsnJHJvb3RTY29wZScsIGZ1bmN0aW9uKHNjb3BlKSB7XG5cdFx0c2NvcGUuaXNHdWVzdCA9IHRydWU7XG5cdFx0c2NvcGUuJHVzZXIgPSB7XG5cdFx0XHRpZDogMCxcblx0XHRcdGVtYWlsOiBudWxsLFxuXHRcdFx0bG9naW46IGZ1bmN0aW9uKGlkLCBlbWFpbCkge1xuXHRcdFx0XHRzY29wZS5pc0d1ZXN0ID0gKGlkID09PSAwKTtcblx0XHRcdFx0c2NvcGUuJHVzZXIuaWQgPSBpZDtcblx0XHRcdFx0c2NvcGUuJHVzZXIuZW1haWwgPSBlbWFpbDtcblx0XHRcdH0sXG5cdFx0XHRsb2dvdXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzY29wZS5pc0d1ZXN0ID0gdHJ1ZTtcblx0XHRcdFx0c2NvcGUuJHVzZXIuaWQgPSAwO1xuXHRcdFx0XHRzY29wZS4kdXNlci5lbWFpbCA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fTtcblx0fV0pO1xufSgpKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnaG9tZS5jb25maWcnLCBbXSlcblx0LmNvbnN0YW50KCdCQVNFX0VORFBPSU5UJywgJ2h0dHA6Ly9jaGF0dHkuZGV2L2FwaS8nKVxuXHQuY29uc3RhbnQoJ0xPR0lOX1VSTCcsICdodHRwOi8vY2hhdHR5LmRldi9hcGkvYXV0aC9sb2dpbicpXG5cdC5jb25zdGFudCgnREVGQVVMVF9IVFRQX0hFQURFUlMnLCB7XG5cdFx0J0NvbnRlbnQtVHlwZSc6ICdBcHBsaWNhdGlvbi9qc29uJ1xuXHR9KTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKXtcblx0J3VzZXIgc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnaG9tZS5jb250cm9sbGVycycsIFtdKVxuXHRcdC5jb250cm9sbGVyKCdIb21lQ3RybCcsIFtcblx0XHRcdCckc2NvcGUnLCAnTWVzc2FnaW5nU2VydmljZScsXG5cdFx0XHRmdW5jdGlvbihzY29wZSwgbWVzc2FnZVNlcnZpY2UpIHtcblx0XHRcdFx0dmFyIG1lc3NhZ2VRdWVyeVJlc3BvbnNlLCBNZXNzYWdlO1xuXHRcdFx0XHRNZXNzYWdlID0gbWVzc2FnZVNlcnZpY2UucmVzb3VyY2U7XG5cdFx0XHRcdHNjb3BlLmxvYWRlZEtleU1hcCA9IFtdO1xuXHRcdFx0XHRzY29wZS4kcGFyZW50LlBhZ2UgPSB7XG5cdFx0XHRcdFx0dGl0bGU6ICdDaGF0dHknXG5cdFx0XHRcdH07XG5cdFx0XHRcdC8vIE9ubGluZSB1c2Vyc1xuXHRcdFx0XHRzY29wZS51c2VycyA9IFtdO1xuXG5cdFx0XHRcdC8vIE1lc3NhZ2VzXG5cdFx0XHRcdHNjb3BlLm1lc3NhZ2VzID0gW107XG5cdFx0XHRcdHNjb3BlLm5leHRQYWdlVXJsID0gbnVsbDtcblx0XHRcdFx0c2NvcGUuY3VycmVudFBhZ2UgPSAxO1xuXHRcdFx0XHRzY29wZS50b3RhbERpc3BsYXllZCA9IDA7XG5cdFx0XHRcdHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0XHRzY29wZS5maXJzdExvYWRUaW1lID0gIE1hdGguZmxvb3IoKG5ldyBEYXRlKFxuXHRcdFx0XHRcdFx0bm93LmdldFVUQ0Z1bGxZZWFyKCksXG5cdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENNb250aCgpLFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDRGF0ZSgpLFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDSG91cnMoKSxcblx0XHRcdFx0XHQgICAgbm93LmdldFVUQ01pbnV0ZXMoKSwgXG5cdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENTZWNvbmRzKClcblx0XHRcdFx0XHQpKS5nZXRUaW1lKCkgLyAxMDAwKTtcblx0XHRcdFx0c2NvcGUuY2hhdCA9IHtcblx0XHRcdFx0XHRtZXNzYWdlOiAnJ1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHNjb3BlLnNjcm9sbFRvQm90dG9tID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHdpbmRvdy5zY3JvbGxUbygwLCB3aW5kb3cuZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQpO1xuXHRcdFx0XHRcdH0sNTAwKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRzY29wZS5sb2FkRWFybGllciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmIChzY29wZS5jdXJyZW50UGFnZSA9PT0gMSB8fCBzY29wZS5uZXh0UGFnZVVybCAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0bWVzc2FnZVF1ZXJ5UmVzcG9uc2UgPSBNZXNzYWdlLnF1ZXJ5KHtwYWdlOiBzY29wZS5jdXJyZW50UGFnZSwgdGltZV9saW1pdDogc2NvcGUuZmlyc3RMb2FkVGltZX0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHRcdFx0ICogUHVzaCBtZXNzYWdlcyBvYmplY3Rcblx0XHRcdFx0XHRcdFx0ICogQHBhcmFtICB7T2JqZWN0fSBtZXNzYWdlKSB7aWQ6IDEsIGVtYWlsOiAnc3RyaW5nJywgbWVzc2FnZTogJ3N0cmluZyc6IGNyZWF0ZWRfYXQ6ICd0aW1lc3RhbXAnfSAgICAgbWVzc2FnZSBvYmplY3Rcblx0XHRcdFx0XHRcdFx0ICogQHJldHVybiB7dm9pZH0gICAgICAgICAgXG5cdFx0XHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0bWVzc2FnZVF1ZXJ5UmVzcG9uc2UuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcblx0XHRcdFx0XHRcdFx0XHRzY29wZS5tZXNzYWdlcy51bnNoaWZ0KG1lc3NhZ2UpO1xuXHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRzY29wZS50b3RhbERpc3BsYXllZCA9IG1lc3NhZ2VRdWVyeVJlc3BvbnNlLnRvO1xuXG5cdFx0XHRcdFx0XHRcdHNjb3BlLm5leHRQYWdlVXJsID0gbWVzc2FnZVF1ZXJ5UmVzcG9uc2UubmV4dF9wYWdlX3VybDtcblx0XHRcdFx0XHRcdFx0aWYgKHNjb3BlLmN1cnJlbnRQYWdlID09PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHdpbmRvdy5zY3JvbGxUbygwLCB3aW5kb3cuZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQpO1xuXHRcdFx0XHRcdFx0XHRcdH0sNTAwKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRpZiAoc2NvcGUubmV4dFBhZ2VVcmwgPT09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0XHRzY29wZS5jdXJyZW50UGFnZSA9IDE7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0c2NvcGUuY3VycmVudFBhZ2UrKztcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vSW5pdCBmaXJzdCBwYWdlXG5cdFx0XHRcdHNjb3BlLmxvYWRFYXJsaWVyKCk7XG5cblx0XHRcdFx0Ly8gSW5pdGlhbCBtZXNzYWdlIHZhbHVlXG5cdFx0XHRcdHNjb3BlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuXHRcdFx0XHRcdHZhciBuZXdNZXNzYWdlO1xuXHRcdFx0XHRcdGlmIChtZXNzYWdlLnRyaW0oKSAhPT0gXCJcIikge1xuXHRcdFx0XHRcdFx0bmV3TWVzc2FnZSA9IG5ldyBNZXNzYWdlKCk7XG5cdFx0XHRcdFx0XHRuZXdNZXNzYWdlLnVzZXJfaWQ9IHNjb3BlLiR1c2VyLmlkO1xuXHRcdFx0XHRcdFx0bmV3TWVzc2FnZS5tZXNzYWdlPSBtZXNzYWdlO1xuXHRcdFx0XHRcdFx0bmV3TWVzc2FnZS4kcHVibGlzaChmdW5jdGlvbihyZXNwb25zZVJlc291cmNlLCByZXNwb25zZUhlYWRlcikge1xuXHRcdFx0XHRcdFx0XHR3aW5kb3cuY29uc29sZS5sb2cocmVzcG9uc2VSZXNvdXJjZSk7XG5cdFx0XHRcdFx0XHRcdG5ld01lc3NhZ2UuaWQgPSByZXNwb25zZVJlc291cmNlLmlkO1xuXHRcdFx0XHRcdFx0XHRuZXdNZXNzYWdlLmNyZWF0ZWRfYXQgPSByZXNwb25zZVJlc291cmNlLmNyZWF0ZWRfYXQ7XG5cdFx0XHRcdFx0XHRcdHNjb3BlLmxvYWRlZEtleU1hcC5wdXNoKG5ld01lc3NhZ2UuaWQpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRuZXdNZXNzYWdlLmVtYWlsPSBzY29wZS4kdXNlci5lbWFpbDtcblx0XHRcdFx0XHRcdHNjb3BlLm1lc3NhZ2VzLnB1c2gobmV3TWVzc2FnZSk7XG5cdFx0XHRcdFx0XHRzY29wZS50b3RhbERpc3BsYXllZCsrO1xuXHRcdFx0XHRcdFx0c2NvcGUuY2hhdC5tZXNzYWdlID0gJyc7XG5cdFx0XHRcdFx0XHRzY29wZS5zY3JvbGxUb0JvdHRvbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fTtcblx0XHRcdFx0bm93ID0gbmV3IERhdGUoKTtcblx0XHRcdFx0dmFyIHN1YnNjcmliZVRpbWVMaW1pdCA9IE1hdGguZmxvb3IoKG5ldyBEYXRlKFxuXHRcdFx0XHRcdFx0bm93LmdldFVUQ0Z1bGxZZWFyKCksXG5cdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENNb250aCgpLFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDRGF0ZSgpLFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDSG91cnMoKSxcblx0XHRcdFx0XHQgICAgbm93LmdldFVUQ01pbnV0ZXMoKSwgXG5cdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENTZWNvbmRzKClcblx0XHRcdFx0XHQpKS5nZXRUaW1lKCkgLyAxMDAwKTtcblx0XHRcdFx0dmFyIHN1YnNjcmliZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdG1lc3NhZ2VTZXJ2aWNlLnN1YnNjcmliZSh7XG5cdFx0XHRcdFx0XHR0aW1lX2xpbWl0OiBzdWJzY3JpYmVUaW1lTGltaXRcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UsIHN0YXR1cykge1xuXHRcdFx0XHRcdFx0XHR3aW5kb3cuY29uc29sZS5sb2cocmVzcG9uc2UpO1xuXHRcdFx0XHRcdFx0XHQvLyBSRWZyZXNoIHRpbWUgd2hlbiBzdWNjZXNzXG5cdFx0XHRcdFx0XHRcdGlmICghIXJlc3BvbnNlLmNvdW50ICYmIHJlc3BvbnNlLmNvdW50ID4gMCkge1xuXHRcdFx0XHRcdFx0XHRcdG5vdyA9IG5ldyBEYXRlKCk7XG5cdFx0XHRcdFx0XHRcdFx0c3Vic2NyaWJlVGltZUxpbWl0ID0gTWF0aC5mbG9vcigobmV3IERhdGUoXG5cdFx0XHRcdFx0XHRcdFx0XHRub3cuZ2V0VVRDRnVsbFllYXIoKSxcblx0XHRcdFx0XHRcdFx0XHQgICAgbm93LmdldFVUQ01vbnRoKCksXG5cdFx0XHRcdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENEYXRlKCksXG5cdFx0XHRcdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENIb3VycygpLFxuXHRcdFx0XHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDTWludXRlcygpLCBcblx0XHRcdFx0XHRcdFx0XHQgICAgbm93LmdldFVUQ1NlY29uZHMoKVxuXHRcdFx0XHRcdFx0XHRcdCkpLmdldFRpbWUoKSAvIDEwMDApO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmVzcG9uc2UuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKHNjb3BlLmxvYWRlZEtleU1hcC5pbmRleE9mKG1lc3NhZ2UuaWQpLCBtZXNzYWdlLCBzY29wZS5sb2FkZWRLZXlNYXApO1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKHNjb3BlLmxvYWRlZEtleU1hcC5pbmRleE9mKG1lc3NhZ2UuaWQpID09PSAtMSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzY29wZS5sb2FkZWRLZXlNYXAucHVzaChtZXNzYWdlLmlkKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2NvcGUubWVzc2FnZXMucHVzaChtZXNzYWdlKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2NvcGUudG90YWxEaXNwbGF5ZWQrKztcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2NvcGUuc2Nyb2xsVG9Cb3R0b20oKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHN1YnNjcmliZSgpO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSwgc3RhdHVzKSB7XG5cdFx0XHRcdFx0XHRcdHdpbmRvdy5jb25zb2xlLmxvZyhyZXNwb25zZSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdFx0Ly8gSW5pdGlhbCBSdW5cblx0XHRcdFx0c3Vic2NyaWJlKCk7XG5cdFx0XHR9XG5cdFx0XSlcblx0XHQuY29udHJvbGxlcignTG9naW5DdHJsJywgW1xuXHRcdFx0JyRzY29wZScsICdBdXRoU2VydmljZScsXG5cdFx0XHRmdW5jdGlvbihzY29wZSwgYXV0aCkge1xuXHRcdFx0XHRzY29wZS5jcmVkZW50aWFscyA9IHtcblx0XHRcdFx0XHRlbWFpbDogXCJcIixcblx0XHRcdFx0XHRwYXNzd29yZDogXCJcIlxuXHRcdFx0XHR9O1xuXHRcdFx0XHRzY29wZS5sb2dpbkluUHJvZ3Jlc3MgPSBmYWxzZTtcblx0XHRcdFx0c2NvcGUuYXV0aGVudGljYXRlID0gZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcblx0XHRcdFx0XHRpZiAoISFjcmVkZW50aWFscy5lbWFpbCAmJiAhIWNyZWRlbnRpYWxzLnBhc3N3b3JkICYmICFzY29wZS5sb2dpbkluUHJvZ3Jlc3MpIHtcblx0XHRcdFx0XHRcdHNjb3BlLmxvZ2luSW5Qcm9ncmVzcyA9IHRydWU7XG5cdFx0XHRcdFx0XHRhdXRoLmF1dGhlbnRpY2F0ZShjcmVkZW50aWFscykuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSwgc3RhdHVzKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG5cdFx0XHRcdFx0XHRcdFx0c2NvcGUuJHVzZXIubG9naW4ocmVzcG9uc2UuZGF0YS5pZCwgcmVzcG9uc2UuZGF0YS5lbWFpbCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0c2NvcGUubG9naW5JblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9KS5lcnJvcihmdW5jdGlvbihyZXNwb25zZSwgc3RhdHVzKSB7XG5cdFx0XHRcdFx0XHRcdHNjb3BlLmxvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdF0pO1xuXG59KCkpOyIsIihmdW5jdGlvbigpe1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2hvbWUuZGlyZWN0aXZlcycsIFtdKVxuXHQuZGlyZWN0aXZlKCdsb2dpbkJveCcsIFtmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdBRScsXG5cdFx0XHR0ZW1wbGF0ZVVybDogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKydwYXJ0aWFscy9kaXJlY3RpdmVfbG9naW5fYm94Lmh0bWwnLFxuXHRcdFx0cmVwbGFjZTogZmFsc2UsXG5cdFx0XHRjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuXHRcdH07XG5cdH1dKTtcbn0oKSk7IiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2hvbWUuc2VydmljZXMnLCBcblx0XHRbJ25nUmVzb3VyY2UnLCAnaG9tZS5jb25maWcnXSxcblx0XHRbJyRwcm92aWRlJywgZnVuY3Rpb24oJHByb3ZpZGUpIHtcblx0XHRcdC8qKlxuXHRcdFx0ICogQXV0aGVudGljYXRpb24gc2VydmljZSBwcm92aWRlclxuXHRcdFx0ICogQHBhcmFtICBPYmplY3QgJGh0dHAgICAgICAgICAgQW5ndWxhciBIdHRwIFByb3ZpZGVyXG5cdFx0XHQgKiBAcGFyYW0gIFN0cmluZyBsb2dpbkVuZHBvaW50ICBMb2dpbiBFbmRwb2ludCBDb25zdGFudC4gXG5cdFx0XHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAU2VlIHJlc291cmNlcy9hbmd1bGFyL2hvbWUvaG9tZS5jb25maWcuanMgdG8gY2hhbmdlIHRoZSB2YWx1ZVxuXHRcdFx0ICogQHJldHVybiBPYmplY3QgICAgICAgICAgICAgICAgQXV0aGVudGljYXRpb24gU2VydmljZVxuXHRcdFx0ICovXG5cdFx0XHQkcHJvdmlkZS5zZXJ2aWNlKCdBdXRoU2VydmljZScsIFsnJGh0dHAnLCdMT0dJTl9VUkwnLCBcblx0XHRcdFx0ZnVuY3Rpb24oJGh0dHAsIGxvZ2luRW5kcG9pbnQpIHtcblx0XHRcdFx0XHR0aGlzLmF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gJGh0dHAucG9zdChsb2dpbkVuZHBvaW50LCBjcmVkZW50aWFscyk7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0XSk7XG5cblx0XHRcdCRwcm92aWRlLmZhY3RvcnkoJ01lc3NhZ2luZ1NlcnZpY2UnLCBbJyRyZXNvdXJjZScsICckaHR0cCcsICdCQVNFX0VORFBPSU5UJywgXG5cdFx0XHRcdGZ1bmN0aW9uKCRyZXNvdXJjZSwgJGh0dHAsIGVuZFBvaW50KSB7XG5cdFx0XHRcdFx0dmFyIGFjdGlvbnM7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0YWN0aW9ucyA9IHtcblx0XHRcdFx0XHRcdCdxdWVyeSc6IHttZXRob2Q6ICdHRVQnLCBpc0FycmF5OiBmYWxzZX0sXG5cdFx0XHRcdFx0XHQncHVibGlzaCc6IHttZXRob2Q6ICdQT1NUJ31cblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHJlc291cmNlOiAkcmVzb3VyY2UoZW5kUG9pbnQrJ21lc3NhZ2UnLCB7fSwgYWN0aW9ucyksXG5cdFx0XHRcdFx0XHRzdWJzY3JpYmU6IGZ1bmN0aW9uKHBhcmFtcykge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRcdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdFx0XHRcdFx0dXJsOiBlbmRQb2ludCsnbWVzc2FnZS9zdWJzY3JpYmUnLFxuXHRcdFx0XHRcdFx0XHRcdHRpbWVvdXQ6IDEwMDAqMjAsXG5cdFx0XHRcdFx0XHRcdFx0cGFyYW1zOiBwYXJhbXNcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0XSk7XG5cdFx0fV1cblx0KTtcbn0oKSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
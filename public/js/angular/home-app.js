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
								scope.totalDisplayed++;
							});

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhvbWUubW9kdWxlLmpzIiwiaG9tZS5jb25maWcuanMiLCJob21lLmNvbnRyb2xsZXIuanMiLCJob21lLmRpcmVjdGl2ZS5qcyIsImhvbWUuc2VydmljZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJob21lLWFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQW5ndWxhciBtb2R1bGUgZm9yIEhvbWUgbW9kdWxlXG4gKi9cbihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXIubW9kdWxlKCdob21lJywgW1xuXHRcdCduZ1JvdXRlJyxcblx0XHQnaG9tZS5jb25maWcnLFxuXHRcdCdob21lLmNvbnRyb2xsZXJzJyxcblx0XHQnaG9tZS5kaXJlY3RpdmVzJyxcblx0XHQnaG9tZS5zZXJ2aWNlcydcblx0XSlcblx0LmNvbmZpZyhbXG5cdFx0JyRyb3V0ZVByb3ZpZGVyJywnJGxvY2F0aW9uUHJvdmlkZXInLCckaHR0cFByb3ZpZGVyJywgJ0RFRkFVTFRfSFRUUF9IRUFERVJTJyxcblx0XHRmdW5jdGlvbigkcm91dGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsIGRlZmF1bHRIZWFkZXJzKSB7XG5cdFx0XHR2YXIgdGVtcGxhdGVQYXRoLCBodHRwSGVhZGVycztcblxuXHRcdFx0Ly9TZXR1cCBkZWZhdWx0IGh0dHAgaGVhZGVyc1xuXHRcdFx0aHR0cEhlYWRlcnMgPSAkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLmhlYWRlcnM7XG5cdFx0XHQkaHR0cFByb3ZpZGVyLmRlZmF1bHRzLndpdGhDcmVkZW50aWFscyA9IGZhbHNlO1xuXHRcdCAgICAvL1NldCBkZWZhdWx0IGhlYWRlcnMgZnJvbSBjb25zdGFudHNcblx0XHQgICAgZm9yICh2YXIgaGVhZGVyTmFtZSBpbiBkZWZhdWx0SGVhZGVycykge1xuXHRcdCAgICAgIGh0dHBIZWFkZXJzLmNvbW1vbltoZWFkZXJOYW1lXSA9IGRlZmF1bHRIZWFkZXJzW2hlYWRlck5hbWVdO1xuXHRcdCAgICB9XG5cblxuXHRcdFx0Ly9BZGQgISB0byBwcmVmaXhcblx0XHQgICAgJGxvY2F0aW9uUHJvdmlkZXIuaGFzaFByZWZpeCgnIScpO1xuXG5cdFx0ICAgIC8vU2V0IHJvdXRlICYgdGVtcGxhdGUgcGF0aFxuXHRcdFx0dGVtcGxhdGVQYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKydwYXJ0aWFscy8nO1xuXHRcdFx0JHJvdXRlUHJvdmlkZXIud2hlbignLycsIHtcblx0XHRcdFx0Y29udHJvbGxlcjogJ0hvbWVDdHJsJywgXG5cdFx0XHRcdHRlbXBsYXRlVXJsOiB0ZW1wbGF0ZVBhdGgrJ2hvbWUuaHRtbCdcblx0XHRcdH0pO1xuXHRcdH1cblx0XSlcblx0LnJ1bihbJyRyb290U2NvcGUnLCBmdW5jdGlvbihzY29wZSkge1xuXHRcdHNjb3BlLmlzR3Vlc3QgPSB0cnVlO1xuXHRcdHNjb3BlLiR1c2VyID0ge1xuXHRcdFx0aWQ6IDAsXG5cdFx0XHRlbWFpbDogbnVsbCxcblx0XHRcdGxvZ2luOiBmdW5jdGlvbihpZCwgZW1haWwpIHtcblx0XHRcdFx0c2NvcGUuaXNHdWVzdCA9IChpZCA9PT0gMCk7XG5cdFx0XHRcdHNjb3BlLiR1c2VyLmlkID0gaWQ7XG5cdFx0XHRcdHNjb3BlLiR1c2VyLmVtYWlsID0gZW1haWw7XG5cdFx0XHR9LFxuXHRcdFx0bG9nb3V0OiBmdW5jdGlvbigpIHtcblx0XHRcdFx0c2NvcGUuaXNHdWVzdCA9IHRydWU7XG5cdFx0XHRcdHNjb3BlLiR1c2VyLmlkID0gMDtcblx0XHRcdFx0c2NvcGUuJHVzZXIuZW1haWwgPSBudWxsO1xuXHRcdFx0fVxuXHRcdH07XG5cdH1dKTtcbn0oKSk7IiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2hvbWUuY29uZmlnJywgW10pXG5cdC5jb25zdGFudCgnQkFTRV9FTkRQT0lOVCcsICdodHRwOi8vY2hhdHR5LmRldi9hcGkvJylcblx0LmNvbnN0YW50KCdMT0dJTl9VUkwnLCAnaHR0cDovL2NoYXR0eS5kZXYvYXBpL2F1dGgvbG9naW4nKVxuXHQuY29uc3RhbnQoJ0RFRkFVTFRfSFRUUF9IRUFERVJTJywge1xuXHRcdCdDb250ZW50LVR5cGUnOiAnQXBwbGljYXRpb24vanNvbidcblx0fSk7XG59KCkpO1xuIiwiKGZ1bmN0aW9uKCl7XG5cdCd1c2VyIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2hvbWUuY29udHJvbGxlcnMnLCBbXSlcblx0XHQuY29udHJvbGxlcignSG9tZUN0cmwnLCBbXG5cdFx0XHQnJHNjb3BlJywgJ01lc3NhZ2luZ1NlcnZpY2UnLFxuXHRcdFx0ZnVuY3Rpb24oc2NvcGUsIG1lc3NhZ2VTZXJ2aWNlKSB7XG5cdFx0XHRcdHZhciBtZXNzYWdlUXVlcnlSZXNwb25zZSwgTWVzc2FnZTtcblx0XHRcdFx0TWVzc2FnZSA9IG1lc3NhZ2VTZXJ2aWNlLnJlc291cmNlO1xuXHRcdFx0XHRzY29wZS5sb2FkZWRLZXlNYXAgPSBbXTtcblx0XHRcdFx0c2NvcGUuJHBhcmVudC5QYWdlID0ge1xuXHRcdFx0XHRcdHRpdGxlOiAnQ2hhdHR5J1xuXHRcdFx0XHR9O1xuXHRcdFx0XHQvLyBPbmxpbmUgdXNlcnNcblx0XHRcdFx0c2NvcGUudXNlcnMgPSBbXTtcblxuXHRcdFx0XHQvLyBNZXNzYWdlc1xuXHRcdFx0XHRzY29wZS5tZXNzYWdlcyA9IFtdO1xuXHRcdFx0XHRzY29wZS5uZXh0UGFnZVVybCA9IG51bGw7XG5cdFx0XHRcdHNjb3BlLmN1cnJlbnRQYWdlID0gMTtcblx0XHRcdFx0c2NvcGUudG90YWxEaXNwbGF5ZWQgPSAwO1xuXHRcdFx0XHR2YXIgbm93ID0gbmV3IERhdGUoKTtcblx0XHRcdFx0c2NvcGUuZmlyc3RMb2FkVGltZSA9ICBNYXRoLmZsb29yKChuZXcgRGF0ZShcblx0XHRcdFx0XHRcdG5vdy5nZXRVVENGdWxsWWVhcigpLFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDTW9udGgoKSxcblx0XHRcdFx0XHQgICAgbm93LmdldFVUQ0RhdGUoKSxcblx0XHRcdFx0XHQgICAgbm93LmdldFVUQ0hvdXJzKCksXG5cdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENNaW51dGVzKCksIFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDU2Vjb25kcygpXG5cdFx0XHRcdFx0KSkuZ2V0VGltZSgpIC8gMTAwMCk7XG5cdFx0XHRcdHNjb3BlLmNoYXQgPSB7XG5cdFx0XHRcdFx0bWVzc2FnZTogJydcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRzY29wZS5zY3JvbGxUb0JvdHRvbSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHR3aW5kb3cuc2Nyb2xsVG8oMCwgd2luZG93LmRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0KTtcblx0XHRcdFx0XHR9LDUwMCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0c2NvcGUubG9hZEVhcmxpZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRpZiAoc2NvcGUuY3VycmVudFBhZ2UgPT09IDEgfHwgc2NvcGUubmV4dFBhZ2VVcmwgIT09IG51bGwpIHtcblx0XHRcdFx0XHRcdG1lc3NhZ2VRdWVyeVJlc3BvbnNlID0gTWVzc2FnZS5xdWVyeSh7cGFnZTogc2NvcGUuY3VycmVudFBhZ2UsIHRpbWVfbGltaXQ6IHNjb3BlLmZpcnN0TG9hZFRpbWV9LCBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0LyoqXG5cdFx0XHRcdFx0XHRcdCAqIFB1c2ggbWVzc2FnZXMgb2JqZWN0XG5cdFx0XHRcdFx0XHRcdCAqIEBwYXJhbSAge09iamVjdH0gbWVzc2FnZSkge2lkOiAxLCBlbWFpbDogJ3N0cmluZycsIG1lc3NhZ2U6ICdzdHJpbmcnOiBjcmVhdGVkX2F0OiAndGltZXN0YW1wJ30gICAgIG1lc3NhZ2Ugb2JqZWN0XG5cdFx0XHRcdFx0XHRcdCAqIEByZXR1cm4ge3ZvaWR9ICAgICAgICAgIFxuXHRcdFx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdG1lc3NhZ2VRdWVyeVJlc3BvbnNlLmRhdGEuZm9yRWFjaChmdW5jdGlvbihtZXNzYWdlKSB7XG5cdFx0XHRcdFx0XHRcdFx0c2NvcGUubWVzc2FnZXMudW5zaGlmdChtZXNzYWdlKTtcblx0XHRcdFx0XHRcdFx0XHRzY29wZS50b3RhbERpc3BsYXllZCsrO1xuXHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRzY29wZS5uZXh0UGFnZVVybCA9IG1lc3NhZ2VRdWVyeVJlc3BvbnNlLm5leHRfcGFnZV91cmw7XG5cdFx0XHRcdFx0XHRcdGlmIChzY29wZS5jdXJyZW50UGFnZSA9PT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR3aW5kb3cuc2Nyb2xsVG8oMCwgd2luZG93LmRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0KTtcblx0XHRcdFx0XHRcdFx0XHR9LDUwMCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0aWYgKHNjb3BlLm5leHRQYWdlVXJsID09PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdFx0c2NvcGUuY3VycmVudFBhZ2UgPSAxO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdHNjb3BlLmN1cnJlbnRQYWdlKys7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHQvL0luaXQgZmlyc3QgcGFnZVxuXHRcdFx0XHRzY29wZS5sb2FkRWFybGllcigpO1xuXG5cdFx0XHRcdC8vIEluaXRpYWwgbWVzc2FnZSB2YWx1ZVxuXHRcdFx0XHRzY29wZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcblx0XHRcdFx0XHR2YXIgbmV3TWVzc2FnZTtcblx0XHRcdFx0XHRpZiAobWVzc2FnZS50cmltKCkgIT09IFwiXCIpIHtcblx0XHRcdFx0XHRcdG5ld01lc3NhZ2UgPSBuZXcgTWVzc2FnZSgpO1xuXHRcdFx0XHRcdFx0bmV3TWVzc2FnZS51c2VyX2lkPSBzY29wZS4kdXNlci5pZDtcblx0XHRcdFx0XHRcdG5ld01lc3NhZ2UubWVzc2FnZT0gbWVzc2FnZTtcblx0XHRcdFx0XHRcdG5ld01lc3NhZ2UuJHB1Ymxpc2goZnVuY3Rpb24ocmVzcG9uc2VSZXNvdXJjZSwgcmVzcG9uc2VIZWFkZXIpIHtcblx0XHRcdFx0XHRcdFx0d2luZG93LmNvbnNvbGUubG9nKHJlc3BvbnNlUmVzb3VyY2UpO1xuXHRcdFx0XHRcdFx0XHRuZXdNZXNzYWdlLmlkID0gcmVzcG9uc2VSZXNvdXJjZS5pZDtcblx0XHRcdFx0XHRcdFx0bmV3TWVzc2FnZS5jcmVhdGVkX2F0ID0gcmVzcG9uc2VSZXNvdXJjZS5jcmVhdGVkX2F0O1xuXHRcdFx0XHRcdFx0XHRzY29wZS5sb2FkZWRLZXlNYXAucHVzaChuZXdNZXNzYWdlLmlkKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0bmV3TWVzc2FnZS5lbWFpbD0gc2NvcGUuJHVzZXIuZW1haWw7XG5cdFx0XHRcdFx0XHRzY29wZS5tZXNzYWdlcy5wdXNoKG5ld01lc3NhZ2UpO1xuXHRcdFx0XHRcdFx0c2NvcGUudG90YWxEaXNwbGF5ZWQrKztcblx0XHRcdFx0XHRcdHNjb3BlLmNoYXQubWVzc2FnZSA9ICcnO1xuXHRcdFx0XHRcdFx0c2NvcGUuc2Nyb2xsVG9Cb3R0b20oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH07XG5cdFx0XHRcdG5vdyA9IG5ldyBEYXRlKCk7XG5cdFx0XHRcdHZhciBzdWJzY3JpYmVUaW1lTGltaXQgPSBNYXRoLmZsb29yKChuZXcgRGF0ZShcblx0XHRcdFx0XHRcdG5vdy5nZXRVVENGdWxsWWVhcigpLFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDTW9udGgoKSxcblx0XHRcdFx0XHQgICAgbm93LmdldFVUQ0RhdGUoKSxcblx0XHRcdFx0XHQgICAgbm93LmdldFVUQ0hvdXJzKCksXG5cdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENNaW51dGVzKCksIFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDU2Vjb25kcygpXG5cdFx0XHRcdFx0KSkuZ2V0VGltZSgpIC8gMTAwMCk7XG5cdFx0XHRcdHZhciBzdWJzY3JpYmUgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRtZXNzYWdlU2VydmljZS5zdWJzY3JpYmUoe1xuXHRcdFx0XHRcdFx0dGltZV9saW1pdDogc3Vic2NyaWJlVGltZUxpbWl0XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlLCBzdGF0dXMpIHtcblx0XHRcdFx0XHRcdFx0d2luZG93LmNvbnNvbGUubG9nKHJlc3BvbnNlKTtcblx0XHRcdFx0XHRcdFx0Ly8gUkVmcmVzaCB0aW1lIHdoZW4gc3VjY2Vzc1xuXHRcdFx0XHRcdFx0XHRpZiAoISFyZXNwb25zZS5jb3VudCAmJiByZXNwb25zZS5jb3VudCA+IDApIHtcblx0XHRcdFx0XHRcdFx0XHRub3cgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0XHRcdFx0XHRcdHN1YnNjcmliZVRpbWVMaW1pdCA9IE1hdGguZmxvb3IoKG5ldyBEYXRlKFxuXHRcdFx0XHRcdFx0XHRcdFx0bm93LmdldFVUQ0Z1bGxZZWFyKCksXG5cdFx0XHRcdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENNb250aCgpLFxuXHRcdFx0XHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDRGF0ZSgpLFxuXHRcdFx0XHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDSG91cnMoKSxcblx0XHRcdFx0XHRcdFx0XHQgICAgbm93LmdldFVUQ01pbnV0ZXMoKSwgXG5cdFx0XHRcdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENTZWNvbmRzKClcblx0XHRcdFx0XHRcdFx0XHQpKS5nZXRUaW1lKCkgLyAxMDAwKTtcblxuXHRcdFx0XHRcdFx0XHRcdHJlc3BvbnNlLmRhdGEuZm9yRWFjaChmdW5jdGlvbihtZXNzYWdlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhzY29wZS5sb2FkZWRLZXlNYXAuaW5kZXhPZihtZXNzYWdlLmlkKSwgbWVzc2FnZSwgc2NvcGUubG9hZGVkS2V5TWFwKTtcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChzY29wZS5sb2FkZWRLZXlNYXAuaW5kZXhPZihtZXNzYWdlLmlkKSA9PT0gLTEpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2NvcGUubG9hZGVkS2V5TWFwLnB1c2gobWVzc2FnZS5pZCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHNjb3BlLm1lc3NhZ2VzLnB1c2gobWVzc2FnZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHNjb3BlLnRvdGFsRGlzcGxheWVkKys7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHNjb3BlLnNjcm9sbFRvQm90dG9tKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRzdWJzY3JpYmUoKTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2UsIHN0YXR1cykge1xuXHRcdFx0XHRcdFx0XHR3aW5kb3cuY29uc29sZS5sb2cocmVzcG9uc2UpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdC8vIEluaXRpYWwgUnVuXG5cdFx0XHRcdHN1YnNjcmliZSgpO1xuXHRcdFx0fVxuXHRcdF0pXG5cdFx0LmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIFtcblx0XHRcdCckc2NvcGUnLCAnQXV0aFNlcnZpY2UnLFxuXHRcdFx0ZnVuY3Rpb24oc2NvcGUsIGF1dGgpIHtcblx0XHRcdFx0c2NvcGUuY3JlZGVudGlhbHMgPSB7XG5cdFx0XHRcdFx0ZW1haWw6IFwiXCIsXG5cdFx0XHRcdFx0cGFzc3dvcmQ6IFwiXCJcblx0XHRcdFx0fTtcblx0XHRcdFx0c2NvcGUubG9naW5JblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdHNjb3BlLmF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XG5cdFx0XHRcdFx0aWYgKCEhY3JlZGVudGlhbHMuZW1haWwgJiYgISFjcmVkZW50aWFscy5wYXNzd29yZCAmJiAhc2NvcGUubG9naW5JblByb2dyZXNzKSB7XG5cdFx0XHRcdFx0XHRzY29wZS5sb2dpbkluUHJvZ3Jlc3MgPSB0cnVlO1xuXHRcdFx0XHRcdFx0YXV0aC5hdXRoZW50aWNhdGUoY3JlZGVudGlhbHMpLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UsIHN0YXR1cykge1xuXHRcdFx0XHRcdFx0XHRpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuXHRcdFx0XHRcdFx0XHRcdHNjb3BlLiR1c2VyLmxvZ2luKHJlc3BvbnNlLmRhdGEuaWQsIHJlc3BvbnNlLmRhdGEuZW1haWwpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHNjb3BlLmxvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0fSkuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2UsIHN0YXR1cykge1xuXHRcdFx0XHRcdFx0XHRzY29wZS5sb2dpbkluUHJvZ3Jlc3MgPSBmYWxzZTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHRdKTtcblxufSgpKTsiLCIoZnVuY3Rpb24oKXtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXIubW9kdWxlKCdob21lLmRpcmVjdGl2ZXMnLCBbXSlcblx0LmRpcmVjdGl2ZSgnbG9naW5Cb3gnLCBbZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0OiAnQUUnLFxuXHRcdFx0dGVtcGxhdGVVcmw6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSsncGFydGlhbHMvZGlyZWN0aXZlX2xvZ2luX2JveC5odG1sJyxcblx0XHRcdHJlcGxhY2U6IGZhbHNlLFxuXHRcdFx0Y29udHJvbGxlcjogJ0xvZ2luQ3RybCdcblx0XHR9O1xuXHR9XSk7XG59KCkpOyIsIihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXIubW9kdWxlKCdob21lLnNlcnZpY2VzJywgXG5cdFx0WyduZ1Jlc291cmNlJywgJ2hvbWUuY29uZmlnJ10sXG5cdFx0WyckcHJvdmlkZScsIGZ1bmN0aW9uKCRwcm92aWRlKSB7XG5cdFx0XHQvKipcblx0XHRcdCAqIEF1dGhlbnRpY2F0aW9uIHNlcnZpY2UgcHJvdmlkZXJcblx0XHRcdCAqIEBwYXJhbSAgT2JqZWN0ICRodHRwICAgICAgICAgIEFuZ3VsYXIgSHR0cCBQcm92aWRlclxuXHRcdFx0ICogQHBhcmFtICBTdHJpbmcgbG9naW5FbmRwb2ludCAgTG9naW4gRW5kcG9pbnQgQ29uc3RhbnQuIFxuXHRcdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQFNlZSByZXNvdXJjZXMvYW5ndWxhci9ob21lL2hvbWUuY29uZmlnLmpzIHRvIGNoYW5nZSB0aGUgdmFsdWVcblx0XHRcdCAqIEByZXR1cm4gT2JqZWN0ICAgICAgICAgICAgICAgIEF1dGhlbnRpY2F0aW9uIFNlcnZpY2Vcblx0XHRcdCAqL1xuXHRcdFx0JHByb3ZpZGUuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBbJyRodHRwJywnTE9HSU5fVVJMJywgXG5cdFx0XHRcdGZ1bmN0aW9uKCRodHRwLCBsb2dpbkVuZHBvaW50KSB7XG5cdFx0XHRcdFx0dGhpcy5hdXRoZW50aWNhdGUgPSBmdW5jdGlvbihjcmVkZW50aWFscykge1xuXHRcdFx0XHRcdFx0cmV0dXJuICRodHRwLnBvc3QobG9naW5FbmRwb2ludCwgY3JlZGVudGlhbHMpO1xuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdF0pO1xuXG5cdFx0XHQkcHJvdmlkZS5mYWN0b3J5KCdNZXNzYWdpbmdTZXJ2aWNlJywgWyckcmVzb3VyY2UnLCAnJGh0dHAnLCAnQkFTRV9FTkRQT0lOVCcsIFxuXHRcdFx0XHRmdW5jdGlvbigkcmVzb3VyY2UsICRodHRwLCBlbmRQb2ludCkge1xuXHRcdFx0XHRcdHZhciBhY3Rpb25zO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGFjdGlvbnMgPSB7XG5cdFx0XHRcdFx0XHQncXVlcnknOiB7bWV0aG9kOiAnR0VUJywgaXNBcnJheTogZmFsc2V9LFxuXHRcdFx0XHRcdFx0J3B1Ymxpc2gnOiB7bWV0aG9kOiAnUE9TVCd9XG5cdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRyZXNvdXJjZTogJHJlc291cmNlKGVuZFBvaW50KydtZXNzYWdlJywge30sIGFjdGlvbnMpLFxuXHRcdFx0XHRcdFx0c3Vic2NyaWJlOiBmdW5jdGlvbihwYXJhbXMpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0XHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0XHRcdFx0XHRcdHVybDogZW5kUG9pbnQrJ21lc3NhZ2Uvc3Vic2NyaWJlJyxcblx0XHRcdFx0XHRcdFx0XHR0aW1lb3V0OiAxMDAwKjIwLFxuXHRcdFx0XHRcdFx0XHRcdHBhcmFtczogcGFyYW1zXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdF0pO1xuXHRcdH1dXG5cdCk7XG59KCkpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
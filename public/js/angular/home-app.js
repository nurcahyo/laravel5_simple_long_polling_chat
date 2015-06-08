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
	.constant('BASE_ENDPOINT', 'http://localhost:8000/api/')
	.constant('LOGIN_URL', 'http://localhost:8000/api/auth/login')
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
				scope.firstLoadTime = Math.floor((new Date()).getTime() / 1000);
				scope.$watch('currentPage', function(oldValues, newValues) {
					if (newValues > oldValues) {

					}
				});

				scope.loadEarlier = function() {
					if (scope.currentPage === 1 || scope.nextPageUrl !== null) {
						messageQueryResponse = Message.query({page: scope.currentPage, time_limit: scope.firstLoadTime}, function() {
							/**
							 * Push messages object
							 * @param  {Object} message) {id: 1, email: 'string', message: 'string': created_at: 'timestamp'}     message object
							 * @return {void}          
							 */
							
							messageQueryResponse.data.forEach(function(message) {
								message.timestamp = (new Date(message.created_at)).getTime();
								scope.messages.unshift(message);
							});

							scope.totalDisplayed = messageQueryResponse.to;

							scope.nextPageUrl = messageQueryResponse.next_page_url;
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
				scope.message = '';
				scope.sendMessage = function(message) {
					var newMessage;
					newMessage = new Message();
					newMessage.user_id= scope.$user.id;
					newMessage.message= message;
					newMessage.$publish(function(responseResource, responseHeader) {
						window.console.log(responseResource);
					});
					scope.message = '';
				};

				var subscribe = function() {
					messageService.subscribe()
						.success(function(response, status) {
							window.console.log(response);
						})
						.error(function(response, status) {
							window.console.log(response);
						});
				};
				// Initial Run
				subscribe();
				setInterval(subscribe, 1000*10);
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
	.directive('loginOrChatBox', [function() {
		var link;
		link = function(scope, el, attrs) {
		};

		return {
			restrict: 'AE',
			templateUrl: window.location.pathname+'partials/directive_login_or_chat_box.html',
			replace: false,
			controller: 'LoginCtrl',
			link: link
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
						subscribe: function() {
							return $http({
								method: 'GET',
								url: endPoint+'message/subscribe',
								timeout: 1000*10
							});
						}
					};
				}
			]);
		}]
	);
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhvbWUubW9kdWxlLmpzIiwiaG9tZS5jb25maWcuanMiLCJob21lLmNvbnRyb2xsZXIuanMiLCJob21lLmRpcmVjdGl2ZS5qcyIsImhvbWUuc2VydmljZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiaG9tZS1hcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFuZ3VsYXIgbW9kdWxlIGZvciBIb21lIG1vZHVsZVxuICovXG4oZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnaG9tZScsIFtcblx0XHQnbmdSb3V0ZScsXG5cdFx0J2hvbWUuY29uZmlnJyxcblx0XHQnaG9tZS5jb250cm9sbGVycycsXG5cdFx0J2hvbWUuZGlyZWN0aXZlcycsXG5cdFx0J2hvbWUuc2VydmljZXMnXG5cdF0pXG5cdC5jb25maWcoW1xuXHRcdCckcm91dGVQcm92aWRlcicsJyRsb2NhdGlvblByb3ZpZGVyJywnJGh0dHBQcm92aWRlcicsICdERUZBVUxUX0hUVFBfSEVBREVSUycsXG5cdFx0ZnVuY3Rpb24oJHJvdXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCBkZWZhdWx0SGVhZGVycykge1xuXHRcdFx0dmFyIHRlbXBsYXRlUGF0aCwgaHR0cEhlYWRlcnM7XG5cblx0XHRcdC8vU2V0dXAgZGVmYXVsdCBodHRwIGhlYWRlcnNcblx0XHRcdGh0dHBIZWFkZXJzID0gJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzO1xuXHRcdFx0JGh0dHBQcm92aWRlci5kZWZhdWx0cy53aXRoQ3JlZGVudGlhbHMgPSBmYWxzZTtcblx0XHQgICAgLy9TZXQgZGVmYXVsdCBoZWFkZXJzIGZyb20gY29uc3RhbnRzXG5cdFx0ICAgIGZvciAodmFyIGhlYWRlck5hbWUgaW4gZGVmYXVsdEhlYWRlcnMpIHtcblx0XHQgICAgICBodHRwSGVhZGVycy5jb21tb25baGVhZGVyTmFtZV0gPSBkZWZhdWx0SGVhZGVyc1toZWFkZXJOYW1lXTtcblx0XHQgICAgfVxuXG5cblx0XHRcdC8vQWRkICEgdG8gcHJlZml4XG5cdFx0ICAgICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJyEnKTtcblxuXHRcdCAgICAvL1NldCByb3V0ZSAmIHRlbXBsYXRlIHBhdGhcblx0XHRcdHRlbXBsYXRlUGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSsncGFydGlhbHMvJztcblx0XHRcdCRyb3V0ZVByb3ZpZGVyLndoZW4oJy8nLCB7XG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdIb21lQ3RybCcsIFxuXHRcdFx0XHR0ZW1wbGF0ZVVybDogdGVtcGxhdGVQYXRoKydob21lLmh0bWwnXG5cdFx0XHR9KTtcblx0XHR9XG5cdF0pXG5cdC5ydW4oWyckcm9vdFNjb3BlJywgZnVuY3Rpb24oc2NvcGUpIHtcblx0XHRzY29wZS5pc0d1ZXN0ID0gdHJ1ZTtcblx0XHRzY29wZS4kdXNlciA9IHtcblx0XHRcdGlkOiAwLFxuXHRcdFx0ZW1haWw6IG51bGwsXG5cdFx0XHRsb2dpbjogZnVuY3Rpb24oaWQsIGVtYWlsKSB7XG5cdFx0XHRcdHNjb3BlLmlzR3Vlc3QgPSAoaWQgPT09IDApO1xuXHRcdFx0XHRzY29wZS4kdXNlci5pZCA9IGlkO1xuXHRcdFx0XHRzY29wZS4kdXNlci5lbWFpbCA9IGVtYWlsO1xuXHRcdFx0fSxcblx0XHRcdGxvZ291dDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHNjb3BlLmlzR3Vlc3QgPSB0cnVlO1xuXHRcdFx0XHRzY29wZS4kdXNlci5pZCA9IDA7XG5cdFx0XHRcdHNjb3BlLiR1c2VyLmVtYWlsID0gbnVsbDtcblx0XHRcdH1cblx0XHR9O1xuXHR9XSk7XG59KCkpOyIsIihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXIubW9kdWxlKCdob21lLmNvbmZpZycsIFtdKVxuXHQuY29uc3RhbnQoJ0JBU0VfRU5EUE9JTlQnLCAnaHR0cDovL2xvY2FsaG9zdDo4MDAwL2FwaS8nKVxuXHQuY29uc3RhbnQoJ0xPR0lOX1VSTCcsICdodHRwOi8vbG9jYWxob3N0OjgwMDAvYXBpL2F1dGgvbG9naW4nKVxuXHQuY29uc3RhbnQoJ0RFRkFVTFRfSFRUUF9IRUFERVJTJywge1xuXHRcdCdDb250ZW50LVR5cGUnOiAnQXBwbGljYXRpb24vanNvbidcblx0fSk7XG59KCkpO1xuIiwiKGZ1bmN0aW9uKCl7XG5cdCd1c2VyIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2hvbWUuY29udHJvbGxlcnMnLCBbXSlcblx0XHQuY29udHJvbGxlcignSG9tZUN0cmwnLCBbXG5cdFx0XHQnJHNjb3BlJywgJ01lc3NhZ2luZ1NlcnZpY2UnLFxuXHRcdFx0ZnVuY3Rpb24oc2NvcGUsIG1lc3NhZ2VTZXJ2aWNlKSB7XG5cdFx0XHRcdHZhciBtZXNzYWdlUXVlcnlSZXNwb25zZSwgTWVzc2FnZTtcblx0XHRcdFx0TWVzc2FnZSA9IG1lc3NhZ2VTZXJ2aWNlLnJlc291cmNlO1xuXHRcdFx0XHRzY29wZS4kcGFyZW50LlBhZ2UgPSB7XG5cdFx0XHRcdFx0dGl0bGU6ICdDaGF0dHknXG5cdFx0XHRcdH07XG5cdFx0XHRcdC8vIE9ubGluZSB1c2Vyc1xuXHRcdFx0XHRzY29wZS51c2VycyA9IFtdO1xuXG5cdFx0XHRcdC8vIE1lc3NhZ2VzXG5cdFx0XHRcdHNjb3BlLm1lc3NhZ2VzID0gW107XG5cdFx0XHRcdHNjb3BlLm5leHRQYWdlVXJsID0gbnVsbDtcblx0XHRcdFx0c2NvcGUuY3VycmVudFBhZ2UgPSAxO1xuXHRcdFx0XHRzY29wZS50b3RhbERpc3BsYXllZCA9IDA7XG5cdFx0XHRcdHNjb3BlLmZpcnN0TG9hZFRpbWUgPSBNYXRoLmZsb29yKChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgLyAxMDAwKTtcblx0XHRcdFx0c2NvcGUuJHdhdGNoKCdjdXJyZW50UGFnZScsIGZ1bmN0aW9uKG9sZFZhbHVlcywgbmV3VmFsdWVzKSB7XG5cdFx0XHRcdFx0aWYgKG5ld1ZhbHVlcyA+IG9sZFZhbHVlcykge1xuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRzY29wZS5sb2FkRWFybGllciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmIChzY29wZS5jdXJyZW50UGFnZSA9PT0gMSB8fCBzY29wZS5uZXh0UGFnZVVybCAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0bWVzc2FnZVF1ZXJ5UmVzcG9uc2UgPSBNZXNzYWdlLnF1ZXJ5KHtwYWdlOiBzY29wZS5jdXJyZW50UGFnZSwgdGltZV9saW1pdDogc2NvcGUuZmlyc3RMb2FkVGltZX0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHRcdFx0ICogUHVzaCBtZXNzYWdlcyBvYmplY3Rcblx0XHRcdFx0XHRcdFx0ICogQHBhcmFtICB7T2JqZWN0fSBtZXNzYWdlKSB7aWQ6IDEsIGVtYWlsOiAnc3RyaW5nJywgbWVzc2FnZTogJ3N0cmluZyc6IGNyZWF0ZWRfYXQ6ICd0aW1lc3RhbXAnfSAgICAgbWVzc2FnZSBvYmplY3Rcblx0XHRcdFx0XHRcdFx0ICogQHJldHVybiB7dm9pZH0gICAgICAgICAgXG5cdFx0XHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0bWVzc2FnZVF1ZXJ5UmVzcG9uc2UuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcblx0XHRcdFx0XHRcdFx0XHRtZXNzYWdlLnRpbWVzdGFtcCA9IChuZXcgRGF0ZShtZXNzYWdlLmNyZWF0ZWRfYXQpKS5nZXRUaW1lKCk7XG5cdFx0XHRcdFx0XHRcdFx0c2NvcGUubWVzc2FnZXMudW5zaGlmdChtZXNzYWdlKTtcblx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0c2NvcGUudG90YWxEaXNwbGF5ZWQgPSBtZXNzYWdlUXVlcnlSZXNwb25zZS50bztcblxuXHRcdFx0XHRcdFx0XHRzY29wZS5uZXh0UGFnZVVybCA9IG1lc3NhZ2VRdWVyeVJlc3BvbnNlLm5leHRfcGFnZV91cmw7XG5cdFx0XHRcdFx0XHRcdGlmIChzY29wZS5uZXh0UGFnZVVybCA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRcdHNjb3BlLmN1cnJlbnRQYWdlID0gMTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRzY29wZS5jdXJyZW50UGFnZSsrO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Ly9Jbml0IGZpcnN0IHBhZ2Vcblx0XHRcdFx0c2NvcGUubG9hZEVhcmxpZXIoKTtcblxuXHRcdFx0XHQvLyBJbml0aWFsIG1lc3NhZ2UgdmFsdWVcblx0XHRcdFx0c2NvcGUubWVzc2FnZSA9ICcnO1xuXHRcdFx0XHRzY29wZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcblx0XHRcdFx0XHR2YXIgbmV3TWVzc2FnZTtcblx0XHRcdFx0XHRuZXdNZXNzYWdlID0gbmV3IE1lc3NhZ2UoKTtcblx0XHRcdFx0XHRuZXdNZXNzYWdlLnVzZXJfaWQ9IHNjb3BlLiR1c2VyLmlkO1xuXHRcdFx0XHRcdG5ld01lc3NhZ2UubWVzc2FnZT0gbWVzc2FnZTtcblx0XHRcdFx0XHRuZXdNZXNzYWdlLiRwdWJsaXNoKGZ1bmN0aW9uKHJlc3BvbnNlUmVzb3VyY2UsIHJlc3BvbnNlSGVhZGVyKSB7XG5cdFx0XHRcdFx0XHR3aW5kb3cuY29uc29sZS5sb2cocmVzcG9uc2VSZXNvdXJjZSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0c2NvcGUubWVzc2FnZSA9ICcnO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHZhciBzdWJzY3JpYmUgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRtZXNzYWdlU2VydmljZS5zdWJzY3JpYmUoKVxuXHRcdFx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UsIHN0YXR1cykge1xuXHRcdFx0XHRcdFx0XHR3aW5kb3cuY29uc29sZS5sb2cocmVzcG9uc2UpO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSwgc3RhdHVzKSB7XG5cdFx0XHRcdFx0XHRcdHdpbmRvdy5jb25zb2xlLmxvZyhyZXNwb25zZSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblx0XHRcdFx0Ly8gSW5pdGlhbCBSdW5cblx0XHRcdFx0c3Vic2NyaWJlKCk7XG5cdFx0XHRcdHNldEludGVydmFsKHN1YnNjcmliZSwgMTAwMCoxMCk7XG5cdFx0XHR9XG5cdFx0XSlcblx0XHQuY29udHJvbGxlcignTG9naW5DdHJsJywgW1xuXHRcdFx0JyRzY29wZScsICdBdXRoU2VydmljZScsXG5cdFx0XHRmdW5jdGlvbihzY29wZSwgYXV0aCkge1xuXHRcdFx0XHRzY29wZS5jcmVkZW50aWFscyA9IHtcblx0XHRcdFx0XHRlbWFpbDogXCJcIixcblx0XHRcdFx0XHRwYXNzd29yZDogXCJcIlxuXHRcdFx0XHR9O1xuXHRcdFx0XHRzY29wZS5sb2dpbkluUHJvZ3Jlc3MgPSBmYWxzZTtcblx0XHRcdFx0c2NvcGUuYXV0aGVudGljYXRlID0gZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcblx0XHRcdFx0XHRpZiAoISFjcmVkZW50aWFscy5lbWFpbCAmJiAhIWNyZWRlbnRpYWxzLnBhc3N3b3JkICYmICFzY29wZS5sb2dpbkluUHJvZ3Jlc3MpIHtcblx0XHRcdFx0XHRcdHNjb3BlLmxvZ2luSW5Qcm9ncmVzcyA9IHRydWU7XG5cdFx0XHRcdFx0XHRhdXRoLmF1dGhlbnRpY2F0ZShjcmVkZW50aWFscykuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSwgc3RhdHVzKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XG5cdFx0XHRcdFx0XHRcdFx0c2NvcGUuJHVzZXIubG9naW4ocmVzcG9uc2UuZGF0YS5pZCwgcmVzcG9uc2UuZGF0YS5lbWFpbCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0c2NvcGUubG9naW5JblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9KS5lcnJvcihmdW5jdGlvbihyZXNwb25zZSwgc3RhdHVzKSB7XG5cdFx0XHRcdFx0XHRcdHNjb3BlLmxvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdF0pO1xuXG59KCkpOyIsIihmdW5jdGlvbigpe1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2hvbWUuZGlyZWN0aXZlcycsIFtdKVxuXHQuZGlyZWN0aXZlKCdsb2dpbk9yQ2hhdEJveCcsIFtmdW5jdGlvbigpIHtcblx0XHR2YXIgbGluaztcblx0XHRsaW5rID0gZnVuY3Rpb24oc2NvcGUsIGVsLCBhdHRycykge1xuXHRcdH07XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdBRScsXG5cdFx0XHR0ZW1wbGF0ZVVybDogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKydwYXJ0aWFscy9kaXJlY3RpdmVfbG9naW5fb3JfY2hhdF9ib3guaHRtbCcsXG5cdFx0XHRyZXBsYWNlOiBmYWxzZSxcblx0XHRcdGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnLFxuXHRcdFx0bGluazogbGlua1xuXHRcdH07XG5cdH1dKTtcbn0oKSk7IiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2hvbWUuc2VydmljZXMnLCBcblx0XHRbJ25nUmVzb3VyY2UnLCAnaG9tZS5jb25maWcnXSxcblx0XHRbJyRwcm92aWRlJywgZnVuY3Rpb24oJHByb3ZpZGUpIHtcblx0XHRcdC8qKlxuXHRcdFx0ICogQXV0aGVudGljYXRpb24gc2VydmljZSBwcm92aWRlclxuXHRcdFx0ICogQHBhcmFtICBPYmplY3QgJGh0dHAgICAgICAgICAgQW5ndWxhciBIdHRwIFByb3ZpZGVyXG5cdFx0XHQgKiBAcGFyYW0gIFN0cmluZyBsb2dpbkVuZHBvaW50ICBMb2dpbiBFbmRwb2ludCBDb25zdGFudC4gXG5cdFx0XHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAU2VlIHJlc291cmNlcy9hbmd1bGFyL2hvbWUvaG9tZS5jb25maWcuanMgdG8gY2hhbmdlIHRoZSB2YWx1ZVxuXHRcdFx0ICogQHJldHVybiBPYmplY3QgICAgICAgICAgICAgICAgQXV0aGVudGljYXRpb24gU2VydmljZVxuXHRcdFx0ICovXG5cdFx0XHQkcHJvdmlkZS5zZXJ2aWNlKCdBdXRoU2VydmljZScsIFsnJGh0dHAnLCdMT0dJTl9VUkwnLCBcblx0XHRcdFx0ZnVuY3Rpb24oJGh0dHAsIGxvZ2luRW5kcG9pbnQpIHtcblx0XHRcdFx0XHR0aGlzLmF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gJGh0dHAucG9zdChsb2dpbkVuZHBvaW50LCBjcmVkZW50aWFscyk7XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0XSk7XG5cblx0XHRcdCRwcm92aWRlLmZhY3RvcnkoJ01lc3NhZ2luZ1NlcnZpY2UnLCBbJyRyZXNvdXJjZScsICckaHR0cCcsICdCQVNFX0VORFBPSU5UJywgXG5cdFx0XHRcdGZ1bmN0aW9uKCRyZXNvdXJjZSwgJGh0dHAsIGVuZFBvaW50KSB7XG5cdFx0XHRcdFx0dmFyIGFjdGlvbnM7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0YWN0aW9ucyA9IHtcblx0XHRcdFx0XHRcdCdxdWVyeSc6IHttZXRob2Q6ICdHRVQnLCBpc0FycmF5OiBmYWxzZX0sXG5cdFx0XHRcdFx0XHQncHVibGlzaCc6IHttZXRob2Q6ICdQT1NUJ31cblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHJlc291cmNlOiAkcmVzb3VyY2UoZW5kUG9pbnQrJ21lc3NhZ2UnLCB7fSwgYWN0aW9ucyksXG5cdFx0XHRcdFx0XHRzdWJzY3JpYmU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRcdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdFx0XHRcdFx0dXJsOiBlbmRQb2ludCsnbWVzc2FnZS9zdWJzY3JpYmUnLFxuXHRcdFx0XHRcdFx0XHRcdHRpbWVvdXQ6IDEwMDAqMTBcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0XSk7XG5cdFx0fV1cblx0KTtcbn0oKSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
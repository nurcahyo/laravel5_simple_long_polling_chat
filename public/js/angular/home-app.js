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
				var messageQueryResponse, Message, now;
				Message = messageService.resource;

				// Loaded key dictionary this is list of blacklist subscribed long poll chat.
				scope.loadedKeyMap = [];

				// Set page title
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
				now = new Date();

				// Set first load time
				// this field will be sent to query resources.
				scope.firstLoadTime =  Math.floor((new Date(
						now.getUTCFullYear(),
					    now.getUTCMonth(),
					    now.getUTCDate(),
					    now.getUTCHours(),
					    now.getUTCMinutes(), 
					    now.getUTCSeconds()
					)).getTime() / 1000);

				// Initial chat message value
				scope.chat = {
					message: ''
				};

				// Handle scroll to latest chat
				scope.scrollToBottom = function() {
					setTimeout(function() {
						window.scrollTo(0, window.document.body.scrollHeight);
					},500);
				};

				// Handle load erlier messages
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


				scope.sendMessage = function(message) {
					var newMessage;
					if (message.trim() !== "") {
						newMessage = new Message();
						newMessage.user_id= scope.$user.id;
						newMessage.message= message;
						newMessage.$publish(function(responseResource, responseHeader) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhvbWUubW9kdWxlLmpzIiwiaG9tZS5jb25maWcuanMiLCJob21lLmNvbnRyb2xsZXIuanMiLCJob21lLmRpcmVjdGl2ZS5qcyIsImhvbWUuc2VydmljZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImhvbWUtYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBbmd1bGFyIG1vZHVsZSBmb3IgSG9tZSBtb2R1bGVcbiAqL1xuKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2hvbWUnLCBbXG5cdFx0J25nUm91dGUnLFxuXHRcdCdob21lLmNvbmZpZycsXG5cdFx0J2hvbWUuY29udHJvbGxlcnMnLFxuXHRcdCdob21lLmRpcmVjdGl2ZXMnLFxuXHRcdCdob21lLnNlcnZpY2VzJ1xuXHRdKVxuXHQuY29uZmlnKFtcblx0XHQnJHJvdXRlUHJvdmlkZXInLCckbG9jYXRpb25Qcm92aWRlcicsJyRodHRwUHJvdmlkZXInLCAnREVGQVVMVF9IVFRQX0hFQURFUlMnLFxuXHRcdGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJGh0dHBQcm92aWRlciwgZGVmYXVsdEhlYWRlcnMpIHtcblx0XHRcdHZhciB0ZW1wbGF0ZVBhdGgsIGh0dHBIZWFkZXJzO1xuXG5cdFx0XHQvL1NldHVwIGRlZmF1bHQgaHR0cCBoZWFkZXJzXG5cdFx0XHRodHRwSGVhZGVycyA9ICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycztcblx0XHRcdCRodHRwUHJvdmlkZXIuZGVmYXVsdHMud2l0aENyZWRlbnRpYWxzID0gZmFsc2U7XG5cdFx0ICAgIC8vU2V0IGRlZmF1bHQgaGVhZGVycyBmcm9tIGNvbnN0YW50c1xuXHRcdCAgICBmb3IgKHZhciBoZWFkZXJOYW1lIGluIGRlZmF1bHRIZWFkZXJzKSB7XG5cdFx0ICAgICAgaHR0cEhlYWRlcnMuY29tbW9uW2hlYWRlck5hbWVdID0gZGVmYXVsdEhlYWRlcnNbaGVhZGVyTmFtZV07XG5cdFx0ICAgIH1cblxuXG5cdFx0XHQvL0FkZCAhIHRvIHByZWZpeFxuXHRcdCAgICAkbG9jYXRpb25Qcm92aWRlci5oYXNoUHJlZml4KCchJyk7XG5cblx0XHQgICAgLy9TZXQgcm91dGUgJiB0ZW1wbGF0ZSBwYXRoXG5cdFx0XHR0ZW1wbGF0ZVBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUrJ3BhcnRpYWxzLyc7XG5cdFx0XHQkcm91dGVQcm92aWRlci53aGVuKCcvJywge1xuXHRcdFx0XHRjb250cm9sbGVyOiAnSG9tZUN0cmwnLCBcblx0XHRcdFx0dGVtcGxhdGVVcmw6IHRlbXBsYXRlUGF0aCsnaG9tZS5odG1sJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRdKVxuXHQucnVuKFsnJHJvb3RTY29wZScsIGZ1bmN0aW9uKHNjb3BlKSB7XG5cdFx0c2NvcGUuaXNHdWVzdCA9IHRydWU7XG5cdFx0c2NvcGUuJHVzZXIgPSB7XG5cdFx0XHRpZDogMCxcblx0XHRcdGVtYWlsOiBudWxsLFxuXHRcdFx0bG9naW46IGZ1bmN0aW9uKGlkLCBlbWFpbCkge1xuXHRcdFx0XHRzY29wZS5pc0d1ZXN0ID0gKGlkID09PSAwKTtcblx0XHRcdFx0c2NvcGUuJHVzZXIuaWQgPSBpZDtcblx0XHRcdFx0c2NvcGUuJHVzZXIuZW1haWwgPSBlbWFpbDtcblx0XHRcdH0sXG5cdFx0XHRsb2dvdXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzY29wZS5pc0d1ZXN0ID0gdHJ1ZTtcblx0XHRcdFx0c2NvcGUuJHVzZXIuaWQgPSAwO1xuXHRcdFx0XHRzY29wZS4kdXNlci5lbWFpbCA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fTtcblx0fV0pO1xufSgpKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnaG9tZS5jb25maWcnLCBbXSlcblx0LmNvbnN0YW50KCdCQVNFX0VORFBPSU5UJywgJ2h0dHA6Ly9jaGF0dHkuZGV2L2FwaS8nKVxuXHQuY29uc3RhbnQoJ0xPR0lOX1VSTCcsICdodHRwOi8vY2hhdHR5LmRldi9hcGkvYXV0aC9sb2dpbicpXG5cdC5jb25zdGFudCgnREVGQVVMVF9IVFRQX0hFQURFUlMnLCB7XG5cdFx0J0NvbnRlbnQtVHlwZSc6ICdBcHBsaWNhdGlvbi9qc29uJ1xuXHR9KTtcbn0oKSk7XG4iLCIoZnVuY3Rpb24oKXtcblx0J3VzZXIgc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnaG9tZS5jb250cm9sbGVycycsIFtdKVxuXHRcdC5jb250cm9sbGVyKCdIb21lQ3RybCcsIFtcblx0XHRcdCckc2NvcGUnLCAnTWVzc2FnaW5nU2VydmljZScsXG5cdFx0XHRmdW5jdGlvbihzY29wZSwgbWVzc2FnZVNlcnZpY2UpIHtcblx0XHRcdFx0dmFyIG1lc3NhZ2VRdWVyeVJlc3BvbnNlLCBNZXNzYWdlLCBub3c7XG5cdFx0XHRcdE1lc3NhZ2UgPSBtZXNzYWdlU2VydmljZS5yZXNvdXJjZTtcblxuXHRcdFx0XHQvLyBMb2FkZWQga2V5IGRpY3Rpb25hcnkgdGhpcyBpcyBsaXN0IG9mIGJsYWNrbGlzdCBzdWJzY3JpYmVkIGxvbmcgcG9sbCBjaGF0LlxuXHRcdFx0XHRzY29wZS5sb2FkZWRLZXlNYXAgPSBbXTtcblxuXHRcdFx0XHQvLyBTZXQgcGFnZSB0aXRsZVxuXHRcdFx0XHRzY29wZS4kcGFyZW50LlBhZ2UgPSB7XG5cdFx0XHRcdFx0dGl0bGU6ICdDaGF0dHknXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Ly8gT25saW5lIHVzZXJzXG5cdFx0XHRcdHNjb3BlLnVzZXJzID0gW107XG5cblx0XHRcdFx0Ly8gTWVzc2FnZXNcblx0XHRcdFx0c2NvcGUubWVzc2FnZXMgPSBbXTtcblx0XHRcdFx0c2NvcGUubmV4dFBhZ2VVcmwgPSBudWxsO1xuXHRcdFx0XHRzY29wZS5jdXJyZW50UGFnZSA9IDE7XG5cdFx0XHRcdHNjb3BlLnRvdGFsRGlzcGxheWVkID0gMDtcblx0XHRcdFx0bm93ID0gbmV3IERhdGUoKTtcblxuXHRcdFx0XHQvLyBTZXQgZmlyc3QgbG9hZCB0aW1lXG5cdFx0XHRcdC8vIHRoaXMgZmllbGQgd2lsbCBiZSBzZW50IHRvIHF1ZXJ5IHJlc291cmNlcy5cblx0XHRcdFx0c2NvcGUuZmlyc3RMb2FkVGltZSA9ICBNYXRoLmZsb29yKChuZXcgRGF0ZShcblx0XHRcdFx0XHRcdG5vdy5nZXRVVENGdWxsWWVhcigpLFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDTW9udGgoKSxcblx0XHRcdFx0XHQgICAgbm93LmdldFVUQ0RhdGUoKSxcblx0XHRcdFx0XHQgICAgbm93LmdldFVUQ0hvdXJzKCksXG5cdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENNaW51dGVzKCksIFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDU2Vjb25kcygpXG5cdFx0XHRcdFx0KSkuZ2V0VGltZSgpIC8gMTAwMCk7XG5cblx0XHRcdFx0Ly8gSW5pdGlhbCBjaGF0IG1lc3NhZ2UgdmFsdWVcblx0XHRcdFx0c2NvcGUuY2hhdCA9IHtcblx0XHRcdFx0XHRtZXNzYWdlOiAnJ1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vIEhhbmRsZSBzY3JvbGwgdG8gbGF0ZXN0IGNoYXRcblx0XHRcdFx0c2NvcGUuc2Nyb2xsVG9Cb3R0b20gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0d2luZG93LnNjcm9sbFRvKDAsIHdpbmRvdy5kb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCk7XG5cdFx0XHRcdFx0fSw1MDApO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vIEhhbmRsZSBsb2FkIGVybGllciBtZXNzYWdlc1xuXHRcdFx0XHRzY29wZS5sb2FkRWFybGllciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmIChzY29wZS5jdXJyZW50UGFnZSA9PT0gMSB8fCBzY29wZS5uZXh0UGFnZVVybCAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0bWVzc2FnZVF1ZXJ5UmVzcG9uc2UgPSBNZXNzYWdlLnF1ZXJ5KHtwYWdlOiBzY29wZS5jdXJyZW50UGFnZSwgdGltZV9saW1pdDogc2NvcGUuZmlyc3RMb2FkVGltZX0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHQvKipcblx0XHRcdFx0XHRcdFx0ICogUHVzaCBtZXNzYWdlcyBvYmplY3Rcblx0XHRcdFx0XHRcdFx0ICogQHBhcmFtICB7T2JqZWN0fSBtZXNzYWdlKSB7aWQ6IDEsIGVtYWlsOiAnc3RyaW5nJywgbWVzc2FnZTogJ3N0cmluZyc6IGNyZWF0ZWRfYXQ6ICd0aW1lc3RhbXAnfSAgICAgbWVzc2FnZSBvYmplY3Rcblx0XHRcdFx0XHRcdFx0ICogQHJldHVybiB7dm9pZH0gICAgICAgICAgXG5cdFx0XHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0bWVzc2FnZVF1ZXJ5UmVzcG9uc2UuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcblx0XHRcdFx0XHRcdFx0XHRzY29wZS5tZXNzYWdlcy51bnNoaWZ0KG1lc3NhZ2UpO1xuXHRcdFx0XHRcdFx0XHRcdHNjb3BlLnRvdGFsRGlzcGxheWVkKys7XG5cdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdHNjb3BlLm5leHRQYWdlVXJsID0gbWVzc2FnZVF1ZXJ5UmVzcG9uc2UubmV4dF9wYWdlX3VybDtcblx0XHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRcdGlmIChzY29wZS5jdXJyZW50UGFnZSA9PT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR3aW5kb3cuc2Nyb2xsVG8oMCwgd2luZG93LmRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0KTtcblx0XHRcdFx0XHRcdFx0XHR9LDUwMCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0aWYgKHNjb3BlLm5leHRQYWdlVXJsID09PSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdFx0c2NvcGUuY3VycmVudFBhZ2UgPSAxO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdHNjb3BlLmN1cnJlbnRQYWdlKys7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHQvL0luaXQgZmlyc3QgcGFnZVxuXHRcdFx0XHRzY29wZS5sb2FkRWFybGllcigpO1xuXG5cblx0XHRcdFx0c2NvcGUuc2VuZE1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG5cdFx0XHRcdFx0dmFyIG5ld01lc3NhZ2U7XG5cdFx0XHRcdFx0aWYgKG1lc3NhZ2UudHJpbSgpICE9PSBcIlwiKSB7XG5cdFx0XHRcdFx0XHRuZXdNZXNzYWdlID0gbmV3IE1lc3NhZ2UoKTtcblx0XHRcdFx0XHRcdG5ld01lc3NhZ2UudXNlcl9pZD0gc2NvcGUuJHVzZXIuaWQ7XG5cdFx0XHRcdFx0XHRuZXdNZXNzYWdlLm1lc3NhZ2U9IG1lc3NhZ2U7XG5cdFx0XHRcdFx0XHRuZXdNZXNzYWdlLiRwdWJsaXNoKGZ1bmN0aW9uKHJlc3BvbnNlUmVzb3VyY2UsIHJlc3BvbnNlSGVhZGVyKSB7XG5cdFx0XHRcdFx0XHRcdG5ld01lc3NhZ2UuaWQgPSByZXNwb25zZVJlc291cmNlLmlkO1xuXHRcdFx0XHRcdFx0XHRuZXdNZXNzYWdlLmNyZWF0ZWRfYXQgPSByZXNwb25zZVJlc291cmNlLmNyZWF0ZWRfYXQ7XG5cdFx0XHRcdFx0XHRcdHNjb3BlLmxvYWRlZEtleU1hcC5wdXNoKG5ld01lc3NhZ2UuaWQpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRuZXdNZXNzYWdlLmVtYWlsPSBzY29wZS4kdXNlci5lbWFpbDtcblx0XHRcdFx0XHRcdHNjb3BlLm1lc3NhZ2VzLnB1c2gobmV3TWVzc2FnZSk7XG5cdFx0XHRcdFx0XHRzY29wZS50b3RhbERpc3BsYXllZCsrO1xuXHRcdFx0XHRcdFx0c2NvcGUuY2hhdC5tZXNzYWdlID0gJyc7XG5cdFx0XHRcdFx0XHRzY29wZS5zY3JvbGxUb0JvdHRvbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fTtcblx0XHRcdFx0bm93ID0gbmV3IERhdGUoKTtcblx0XHRcdFx0dmFyIHN1YnNjcmliZVRpbWVMaW1pdCA9IE1hdGguZmxvb3IoKG5ldyBEYXRlKFxuXHRcdFx0XHRcdFx0bm93LmdldFVUQ0Z1bGxZZWFyKCksXG5cdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENNb250aCgpLFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDRGF0ZSgpLFxuXHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDSG91cnMoKSxcblx0XHRcdFx0XHQgICAgbm93LmdldFVUQ01pbnV0ZXMoKSwgXG5cdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENTZWNvbmRzKClcblx0XHRcdFx0XHQpKS5nZXRUaW1lKCkgLyAxMDAwKTtcblx0XHRcdFx0dmFyIHN1YnNjcmliZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdG1lc3NhZ2VTZXJ2aWNlLnN1YnNjcmliZSh7XG5cdFx0XHRcdFx0XHR0aW1lX2xpbWl0OiBzdWJzY3JpYmVUaW1lTGltaXRcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UsIHN0YXR1cykge1xuXHRcdFx0XHRcdFx0XHQvLyBSRWZyZXNoIHRpbWUgd2hlbiBzdWNjZXNzXG5cdFx0XHRcdFx0XHRcdGlmICghIXJlc3BvbnNlLmNvdW50ICYmIHJlc3BvbnNlLmNvdW50ID4gMCkge1xuXHRcdFx0XHRcdFx0XHRcdG5vdyA9IG5ldyBEYXRlKCk7XG5cdFx0XHRcdFx0XHRcdFx0c3Vic2NyaWJlVGltZUxpbWl0ID0gTWF0aC5mbG9vcigobmV3IERhdGUoXG5cdFx0XHRcdFx0XHRcdFx0XHRub3cuZ2V0VVRDRnVsbFllYXIoKSxcblx0XHRcdFx0XHRcdFx0XHQgICAgbm93LmdldFVUQ01vbnRoKCksXG5cdFx0XHRcdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENEYXRlKCksXG5cdFx0XHRcdFx0XHRcdFx0ICAgIG5vdy5nZXRVVENIb3VycygpLFxuXHRcdFx0XHRcdFx0XHRcdCAgICBub3cuZ2V0VVRDTWludXRlcygpLCBcblx0XHRcdFx0XHRcdFx0XHQgICAgbm93LmdldFVUQ1NlY29uZHMoKVxuXHRcdFx0XHRcdFx0XHRcdCkpLmdldFRpbWUoKSAvIDEwMDApO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmVzcG9uc2UuZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChzY29wZS5sb2FkZWRLZXlNYXAuaW5kZXhPZihtZXNzYWdlLmlkKSA9PT0gLTEpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0c2NvcGUubG9hZGVkS2V5TWFwLnB1c2gobWVzc2FnZS5pZCk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHNjb3BlLm1lc3NhZ2VzLnB1c2gobWVzc2FnZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHNjb3BlLnRvdGFsRGlzcGxheWVkKys7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHNjb3BlLnNjcm9sbFRvQm90dG9tKCk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRzdWJzY3JpYmUoKTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2UsIHN0YXR1cykge1xuXHRcdFx0XHRcdFx0XHR3aW5kb3cuY29uc29sZS5sb2cocmVzcG9uc2UpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdC8vIEluaXRpYWwgUnVuXG5cdFx0XHRcdHN1YnNjcmliZSgpO1xuXHRcdFx0fVxuXHRcdF0pXG5cdFx0LmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIFtcblx0XHRcdCckc2NvcGUnLCAnQXV0aFNlcnZpY2UnLFxuXHRcdFx0ZnVuY3Rpb24oc2NvcGUsIGF1dGgpIHtcblx0XHRcdFx0c2NvcGUuY3JlZGVudGlhbHMgPSB7XG5cdFx0XHRcdFx0ZW1haWw6IFwiXCIsXG5cdFx0XHRcdFx0cGFzc3dvcmQ6IFwiXCJcblx0XHRcdFx0fTtcblx0XHRcdFx0c2NvcGUubG9naW5JblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdHNjb3BlLmF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XG5cdFx0XHRcdFx0aWYgKCEhY3JlZGVudGlhbHMuZW1haWwgJiYgISFjcmVkZW50aWFscy5wYXNzd29yZCAmJiAhc2NvcGUubG9naW5JblByb2dyZXNzKSB7XG5cdFx0XHRcdFx0XHRzY29wZS5sb2dpbkluUHJvZ3Jlc3MgPSB0cnVlO1xuXHRcdFx0XHRcdFx0YXV0aC5hdXRoZW50aWNhdGUoY3JlZGVudGlhbHMpLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UsIHN0YXR1cykge1xuXHRcdFx0XHRcdFx0XHRpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xuXHRcdFx0XHRcdFx0XHRcdHNjb3BlLiR1c2VyLmxvZ2luKHJlc3BvbnNlLmRhdGEuaWQsIHJlc3BvbnNlLmRhdGEuZW1haWwpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHNjb3BlLmxvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0fSkuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2UsIHN0YXR1cykge1xuXHRcdFx0XHRcdFx0XHRzY29wZS5sb2dpbkluUHJvZ3Jlc3MgPSBmYWxzZTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHRdKTtcblxufSgpKTsiLCIoZnVuY3Rpb24oKXtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXIubW9kdWxlKCdob21lLmRpcmVjdGl2ZXMnLCBbXSlcblx0LmRpcmVjdGl2ZSgnbG9naW5Cb3gnLCBbZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0OiAnQUUnLFxuXHRcdFx0dGVtcGxhdGVVcmw6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSsncGFydGlhbHMvZGlyZWN0aXZlX2xvZ2luX2JveC5odG1sJyxcblx0XHRcdHJlcGxhY2U6IGZhbHNlLFxuXHRcdFx0Y29udHJvbGxlcjogJ0xvZ2luQ3RybCdcblx0XHR9O1xuXHR9XSk7XG59KCkpOyIsIihmdW5jdGlvbigpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXIubW9kdWxlKCdob21lLnNlcnZpY2VzJywgXG5cdFx0WyduZ1Jlc291cmNlJywgJ2hvbWUuY29uZmlnJ10sXG5cdFx0WyckcHJvdmlkZScsIGZ1bmN0aW9uKCRwcm92aWRlKSB7XG5cdFx0XHQvKipcblx0XHRcdCAqIEF1dGhlbnRpY2F0aW9uIHNlcnZpY2UgcHJvdmlkZXJcblx0XHRcdCAqIEBwYXJhbSAgT2JqZWN0ICRodHRwICAgICAgICAgIEFuZ3VsYXIgSHR0cCBQcm92aWRlclxuXHRcdFx0ICogQHBhcmFtICBTdHJpbmcgbG9naW5FbmRwb2ludCAgTG9naW4gRW5kcG9pbnQgQ29uc3RhbnQuIFxuXHRcdFx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQFNlZSByZXNvdXJjZXMvYW5ndWxhci9ob21lL2hvbWUuY29uZmlnLmpzIHRvIGNoYW5nZSB0aGUgdmFsdWVcblx0XHRcdCAqIEByZXR1cm4gT2JqZWN0ICAgICAgICAgICAgICAgIEF1dGhlbnRpY2F0aW9uIFNlcnZpY2Vcblx0XHRcdCAqL1xuXHRcdFx0JHByb3ZpZGUuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBbJyRodHRwJywnTE9HSU5fVVJMJywgXG5cdFx0XHRcdGZ1bmN0aW9uKCRodHRwLCBsb2dpbkVuZHBvaW50KSB7XG5cdFx0XHRcdFx0dGhpcy5hdXRoZW50aWNhdGUgPSBmdW5jdGlvbihjcmVkZW50aWFscykge1xuXHRcdFx0XHRcdFx0cmV0dXJuICRodHRwLnBvc3QobG9naW5FbmRwb2ludCwgY3JlZGVudGlhbHMpO1xuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdF0pO1xuXG5cdFx0XHQkcHJvdmlkZS5mYWN0b3J5KCdNZXNzYWdpbmdTZXJ2aWNlJywgWyckcmVzb3VyY2UnLCAnJGh0dHAnLCAnQkFTRV9FTkRQT0lOVCcsIFxuXHRcdFx0XHRmdW5jdGlvbigkcmVzb3VyY2UsICRodHRwLCBlbmRQb2ludCkge1xuXHRcdFx0XHRcdHZhciBhY3Rpb25zO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGFjdGlvbnMgPSB7XG5cdFx0XHRcdFx0XHQncXVlcnknOiB7bWV0aG9kOiAnR0VUJywgaXNBcnJheTogZmFsc2V9LFxuXHRcdFx0XHRcdFx0J3B1Ymxpc2gnOiB7bWV0aG9kOiAnUE9TVCd9XG5cdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRyZXNvdXJjZTogJHJlc291cmNlKGVuZFBvaW50KydtZXNzYWdlJywge30sIGFjdGlvbnMpLFxuXHRcdFx0XHRcdFx0c3Vic2NyaWJlOiBmdW5jdGlvbihwYXJhbXMpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0XHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0XHRcdFx0XHRcdHVybDogZW5kUG9pbnQrJ21lc3NhZ2Uvc3Vic2NyaWJlJyxcblx0XHRcdFx0XHRcdFx0XHR0aW1lb3V0OiAxMDAwKjIwLFxuXHRcdFx0XHRcdFx0XHRcdHBhcmFtczogcGFyYW1zXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdF0pO1xuXHRcdH1dXG5cdCk7XG59KCkpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
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
		window.scope = scope;
	}]);
}());
(function() {
	'use strict';

	angular.module('home.config', [])
	.constant('BASE_ENDPOINT', 'http://localhost:8000/api/')
	.constant('LOGIN_URL', 'http://localhost:8000/api/auth/login')
	.constant('DEFAULT_HTTP_HEADERS', {
		// 'Content-Type': 'Application/json'
	});
}());

(function(){
	'user strict';

	angular.module('home.controllers', [])
		.controller('HomeCtrl', [
			'$scope',
			function(scope) {
				scope.$parent.Page = {
					title: 'Chatty'
				};
				scope.users = [];
				scope.messages = [
					{
						user: {
							email: "Nurcahyo@gmail.com",
							id: 1
						},
						message: "Hello world"
					}
				];
				
				scope.message = '';

				scope.sendMessage = function(message) {
					window.console.log(message);
					scope.message = '';
				};
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
				scope.login = function(credentials) {
					if (!!credentials.email && !!credentials.password && !scope.loginInProgress) {
						scope.loginInProgress = true;
						auth.authenticate(credentials).success(function(response, status) {
							if (response.success) {
								scope.isGuest = false;
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
			$provide.service('AuthService', ['$http','LOGIN_URL', 
				function($http, loginEndpoint) {
					this.authenticate = function(credentials) {
						return $http.post(loginEndpoint, credentials);
					};
				}
			]);
		}]
	);
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhvbWUubW9kdWxlLmpzIiwiaG9tZS5jb25maWcuanMiLCJob21lLmNvbnRyb2xsZXIuanMiLCJob21lLmRpcmVjdGl2ZS5qcyIsImhvbWUuc2VydmljZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiaG9tZS1hcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFuZ3VsYXIgbW9kdWxlIGZvciBIb21lIG1vZHVsZVxuICovXG4oZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnaG9tZScsIFtcblx0XHQnbmdSb3V0ZScsXG5cdFx0J2hvbWUuY29uZmlnJyxcblx0XHQnaG9tZS5jb250cm9sbGVycycsXG5cdFx0J2hvbWUuZGlyZWN0aXZlcycsXG5cdFx0J2hvbWUuc2VydmljZXMnXG5cdF0pXG5cdC5jb25maWcoW1xuXHRcdCckcm91dGVQcm92aWRlcicsJyRsb2NhdGlvblByb3ZpZGVyJywnJGh0dHBQcm92aWRlcicsICdERUZBVUxUX0hUVFBfSEVBREVSUycsXG5cdFx0ZnVuY3Rpb24oJHJvdXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyLCBkZWZhdWx0SGVhZGVycykge1xuXHRcdFx0dmFyIHRlbXBsYXRlUGF0aCwgaHR0cEhlYWRlcnM7XG5cblx0XHRcdC8vU2V0dXAgZGVmYXVsdCBodHRwIGhlYWRlcnNcblx0XHRcdGh0dHBIZWFkZXJzID0gJGh0dHBQcm92aWRlci5kZWZhdWx0cy5oZWFkZXJzO1xuXHRcdFx0JGh0dHBQcm92aWRlci5kZWZhdWx0cy53aXRoQ3JlZGVudGlhbHMgPSBmYWxzZTtcblx0XHQgICAgLy9TZXQgZGVmYXVsdCBoZWFkZXJzIGZyb20gY29uc3RhbnRzXG5cdFx0ICAgIGZvciAodmFyIGhlYWRlck5hbWUgaW4gZGVmYXVsdEhlYWRlcnMpIHtcblx0XHQgICAgICBodHRwSGVhZGVycy5jb21tb25baGVhZGVyTmFtZV0gPSBkZWZhdWx0SGVhZGVyc1toZWFkZXJOYW1lXTtcblx0XHQgICAgfVxuXG5cblx0XHRcdC8vQWRkICEgdG8gcHJlZml4XG5cdFx0ICAgICRsb2NhdGlvblByb3ZpZGVyLmhhc2hQcmVmaXgoJyEnKTtcblxuXHRcdCAgICAvL1NldCByb3V0ZSAmIHRlbXBsYXRlIHBhdGhcblx0XHRcdHRlbXBsYXRlUGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSsncGFydGlhbHMvJztcblx0XHRcdCRyb3V0ZVByb3ZpZGVyLndoZW4oJy8nLCB7XG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdIb21lQ3RybCcsIFxuXHRcdFx0XHR0ZW1wbGF0ZVVybDogdGVtcGxhdGVQYXRoKydob21lLmh0bWwnXG5cdFx0XHR9KTtcblx0XHR9XG5cdF0pXG5cdC5ydW4oWyckcm9vdFNjb3BlJywgZnVuY3Rpb24oc2NvcGUpIHtcblx0XHRzY29wZS5pc0d1ZXN0ID0gdHJ1ZTtcblx0XHR3aW5kb3cuc2NvcGUgPSBzY29wZTtcblx0fV0pO1xufSgpKTsiLCIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnaG9tZS5jb25maWcnLCBbXSlcblx0LmNvbnN0YW50KCdCQVNFX0VORFBPSU5UJywgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9hcGkvJylcblx0LmNvbnN0YW50KCdMT0dJTl9VUkwnLCAnaHR0cDovL2xvY2FsaG9zdDo4MDAwL2FwaS9hdXRoL2xvZ2luJylcblx0LmNvbnN0YW50KCdERUZBVUxUX0hUVFBfSEVBREVSUycsIHtcblx0XHQvLyAnQ29udGVudC1UeXBlJzogJ0FwcGxpY2F0aW9uL2pzb24nXG5cdH0pO1xufSgpKTtcbiIsIihmdW5jdGlvbigpe1xuXHQndXNlciBzdHJpY3QnO1xuXG5cdGFuZ3VsYXIubW9kdWxlKCdob21lLmNvbnRyb2xsZXJzJywgW10pXG5cdFx0LmNvbnRyb2xsZXIoJ0hvbWVDdHJsJywgW1xuXHRcdFx0JyRzY29wZScsXG5cdFx0XHRmdW5jdGlvbihzY29wZSkge1xuXHRcdFx0XHRzY29wZS4kcGFyZW50LlBhZ2UgPSB7XG5cdFx0XHRcdFx0dGl0bGU6ICdDaGF0dHknXG5cdFx0XHRcdH07XG5cdFx0XHRcdHNjb3BlLnVzZXJzID0gW107XG5cdFx0XHRcdHNjb3BlLm1lc3NhZ2VzID0gW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHVzZXI6IHtcblx0XHRcdFx0XHRcdFx0ZW1haWw6IFwiTnVyY2FoeW9AZ21haWwuY29tXCIsXG5cdFx0XHRcdFx0XHRcdGlkOiAxXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0bWVzc2FnZTogXCJIZWxsbyB3b3JsZFwiXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRdO1xuXHRcdFx0XHRcblx0XHRcdFx0c2NvcGUubWVzc2FnZSA9ICcnO1xuXG5cdFx0XHRcdHNjb3BlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuXHRcdFx0XHRcdHdpbmRvdy5jb25zb2xlLmxvZyhtZXNzYWdlKTtcblx0XHRcdFx0XHRzY29wZS5tZXNzYWdlID0gJyc7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XSlcblx0XHQuY29udHJvbGxlcignTG9naW5DdHJsJywgW1xuXHRcdFx0JyRzY29wZScsICdBdXRoU2VydmljZScsXG5cdFx0XHRmdW5jdGlvbihzY29wZSwgYXV0aCkge1xuXHRcdFx0XHRzY29wZS5jcmVkZW50aWFscyA9IHtcblx0XHRcdFx0XHRlbWFpbDogXCJcIixcblx0XHRcdFx0XHRwYXNzd29yZDogXCJcIlxuXHRcdFx0XHR9O1xuXHRcdFx0XHRzY29wZS5sb2dpbkluUHJvZ3Jlc3MgPSBmYWxzZTtcblx0XHRcdFx0c2NvcGUubG9naW4gPSBmdW5jdGlvbihjcmVkZW50aWFscykge1xuXHRcdFx0XHRcdGlmICghIWNyZWRlbnRpYWxzLmVtYWlsICYmICEhY3JlZGVudGlhbHMucGFzc3dvcmQgJiYgIXNjb3BlLmxvZ2luSW5Qcm9ncmVzcykge1xuXHRcdFx0XHRcdFx0c2NvcGUubG9naW5JblByb2dyZXNzID0gdHJ1ZTtcblx0XHRcdFx0XHRcdGF1dGguYXV0aGVudGljYXRlKGNyZWRlbnRpYWxzKS5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlLCBzdGF0dXMpIHtcblx0XHRcdFx0XHRcdFx0aWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcblx0XHRcdFx0XHRcdFx0XHRzY29wZS5pc0d1ZXN0ID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0c2NvcGUubG9naW5JblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9KS5lcnJvcihmdW5jdGlvbihyZXNwb25zZSwgc3RhdHVzKSB7XG5cdFx0XHRcdFx0XHRcdHNjb3BlLmxvZ2luSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdF0pO1xuXG59KCkpOyIsIihmdW5jdGlvbigpe1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2hvbWUuZGlyZWN0aXZlcycsIFtdKVxuXHQuZGlyZWN0aXZlKCdsb2dpbk9yQ2hhdEJveCcsIFtmdW5jdGlvbigpIHtcblx0XHR2YXIgbGluaztcblx0XHRsaW5rID0gZnVuY3Rpb24oc2NvcGUsIGVsLCBhdHRycykge1xuXHRcdH07XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3Q6ICdBRScsXG5cdFx0XHR0ZW1wbGF0ZVVybDogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKydwYXJ0aWFscy9kaXJlY3RpdmVfbG9naW5fb3JfY2hhdF9ib3guaHRtbCcsXG5cdFx0XHRyZXBsYWNlOiBmYWxzZSxcblx0XHRcdGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnLFxuXHRcdFx0bGluazogbGlua1xuXHRcdH07XG5cdH1dKTtcbn0oKSk7IiwiKGZ1bmN0aW9uKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2hvbWUuc2VydmljZXMnLCBcblx0XHRbJ25nUmVzb3VyY2UnLCAnaG9tZS5jb25maWcnXSxcblx0XHRbJyRwcm92aWRlJywgZnVuY3Rpb24oJHByb3ZpZGUpIHtcblx0XHRcdCRwcm92aWRlLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgWyckaHR0cCcsJ0xPR0lOX1VSTCcsIFxuXHRcdFx0XHRmdW5jdGlvbigkaHR0cCwgbG9naW5FbmRwb2ludCkge1xuXHRcdFx0XHRcdHRoaXMuYXV0aGVudGljYXRlID0gZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcblx0XHRcdFx0XHRcdHJldHVybiAkaHR0cC5wb3N0KGxvZ2luRW5kcG9pbnQsIGNyZWRlbnRpYWxzKTtcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cdFx0XHRdKTtcblx0XHR9XVxuXHQpO1xufSgpKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
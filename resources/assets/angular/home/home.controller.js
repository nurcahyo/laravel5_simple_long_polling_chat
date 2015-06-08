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
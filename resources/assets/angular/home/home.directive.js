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
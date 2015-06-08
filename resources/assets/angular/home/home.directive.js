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
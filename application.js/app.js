(function() {
	'use strict';

	angular.module('chatty', [
		'ngRoute'
	])
	.config([
			'$routeProvider', 
			'$locationProvider',
			'$httpProvider'
		], function($routeProvider, $locationProvider, $httpProvider) {
			console.log("test");
		});
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhvbWUvaG9tZS5tb2R1bGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnY2hhdHR5JywgW1xuXHRcdCduZ1JvdXRlJ1xuXHRdKVxuXHQuY29uZmlnKFtcblx0XHRcdCckcm91dGVQcm92aWRlcicsIFxuXHRcdFx0JyRsb2NhdGlvblByb3ZpZGVyJyxcblx0XHRcdCckaHR0cFByb3ZpZGVyJ1xuXHRcdF0sIGZ1bmN0aW9uKCRyb3V0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJGh0dHBQcm92aWRlcikge1xuXHRcdFx0Y29uc29sZS5sb2coXCJ0ZXN0XCIpO1xuXHRcdH0pO1xufSgpKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
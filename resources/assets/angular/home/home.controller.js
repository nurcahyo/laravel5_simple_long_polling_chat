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
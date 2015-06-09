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
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
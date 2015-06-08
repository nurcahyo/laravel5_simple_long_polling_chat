<?php
/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

Route::get('/', function() {
	return Response::json([
		'error' => [
			'message' => 'Unsupported get request.',
			'code' => 100
		]
	]);
});

Route::group( ['prefix' =>'api'], function() {
	Route::controller('auth', 'AuthController');
	Route::resource('message', 'MessageController', ['only' => ['index', 'store']]);
	Route::get('message/subscribe', 'MessageController@subscribe');
});
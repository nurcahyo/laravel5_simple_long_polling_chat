<?php namespace App\Http\Controllers;

use App\Http\Requests;
use App\Http\Controllers\Controller;

// Facades
use Request;
use Auth;
use Hash;

// Model
use App\User;

final class AuthController extends Controller {

	/**
	 * Display a listing of the resource.
	 *
	 * @return Response
	 */
	public function postLogin()
	{	
		// Validate email and password submitted
		// Email and password are mandatory
		$this->validate(Request::instance(), [
			'email' => 'required|email',
			'password' => 'required'
		]);
		
		$email = Request::input('email', '');
		$password = Request::input('password', '');
		$success = false;
		
		if (Auth::attempt(['email' => $email, 'password' => $password])) {
			return $this->handleSuccessLogin($email);
		}
		
		return $this->handleFailedLogin($email, $password);
		
	}

	/**
	 * Handle success login
	 * 
	 * @param  string $email    				User email
	 * @return Illuminate\Http\JsonResponse     Rest json response
	 */
	private function handleSuccessLogin($email)
	{
		$data = compact('email');
		$messages = [trans('auth.success_login')];
		$data['id'] = Auth::user()->id;

		return $this->createJsonResponse(true, $messages, $data);
	}

	/**
	 * Handle login failed
	 * This method called when input email and password not match or user not exists
	 * When user not exists it will create a new one and login using it.
	 *
	 * @param  string $email           user email
	 * @param  string $enteredPassword user non hashed password
	 * @return                   [description]
	 */
	private function handleFailedLogin($email, $enteredPassword)
	{
		$foundUser = User::where('email', $email)->count() > 0;

		// If user not exists
		if (!$foundUser) {
			// Hash password first
			$password = Hash::make($enteredPassword);

			// Create user
			$user = User::create(compact('email', 'password'));

			// force login user
			Auth::login($user);

			// Sent success logged in response
			return $this->handleSuccessLogin($email);
		}

		$messages = [trans('auth.error_login_invalid_password')];

		// Sent error invalid password response
		return $this->createJsonResponse(false, $messages, null);
	}


	// Just for debug purpose
	public function getLogin() {
		return $this->postLogin();
	}

}

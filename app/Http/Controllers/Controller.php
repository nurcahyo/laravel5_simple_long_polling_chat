<?php namespace App\Http\Controllers;

use Illuminate\Foundation\Bus\DispatchesCommands;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;
use Response;

abstract class Controller extends BaseController {

	use DispatchesCommands, ValidatesRequests;

	/**
	 * Create the response for when a request fails validation.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @param  array  $errors
	 * @return \Illuminate\Http\Response
	 */
	protected function buildFailedValidationResponse(Request $request, array $errors)
	{ 
		return $this->createJsonResponse(false, $errors, null, 422);
	}

	public function createJsonResponse($success, array $messages = null, $data = null, $code = 200) {
		return Response::json(compact('success', 'messages', 'data'), $code);
	}
}

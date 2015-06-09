<?php namespace App\Http\Controllers;

use App\Http\Requests;
use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

//Facedes
use Response;
use DB;

use Carbon\Carbon;

//Model
use App\Message;
use App\User;

class MessageController extends Controller {

	/**
	 * Display a listing of the resource.
	 *
	 * @return Response
	 */
	public function index(Request $request)
	{
		// Don't block session for this route
        session_write_close();

		$messages = DB::table(Message::$TABLE)
			->join(User::$TABLE, User::$TABLE . '.id','=', Message::$TABLE . '.user_id')
			->select(Message::$TABLE . '.id', User::$TABLE . '.email', Message::$TABLE . '.message', Message::$TABLE . '.created_at')
			->orderBy(Message::$TABLE . '.created_at', 'DESC')
			->where(Message::$TABLE . '.created_at', '<', DB::RAW($this->getTimeQuery($request->input('time_limit'))))
			->simplePaginate(10);

		$data = $messages->toArray();
		return Response::json($data);
	}

	/**
	 * Store a newly created resource in storage.
	 *
	 * @return Response
	 */
	public function store(Request $request)
	{
		$this->validate($request, [
			'message' => 'required',
			'user_id' => 'required'
		]);

		$user_id = $request->input('user_id');
		$message = $request->input('message');
		$model = DB::table(Message::$TABLE)
					->join(User::$TABLE, User::$TABLE . '.id','=', Message::$TABLE . '.user_id')
					->select(Message::$TABLE . '.id', User::$TABLE . '.email', Message::$TABLE . '.message', Message::$TABLE . '.created_at')
					->where(Message::$TABLE . '.id', Message::create(compact('user_id', 'message'))->id)
					->first();

		return Response::json($model);
	}

	/**
	 * Poll new message
	 * @param  Request $request Request object
	 * @return Response
	 */
	public function subscribe(Request $request) {
		// Don't block session for this route
		// 
        session_write_close();

        $timelimit = $this->getTimeQuery($request->input('time_limit'));

		$message = DB::table(Message::$TABLE)
			->where(Message::$TABLE . '.created_at', '>', DB::RAW($timelimit));

		$looperEnd = Carbon::now()->addSeconds(10)->timestamp;
		$data = [];

		while(($count = $message->count()) <= 0 && time() < $looperEnd) {
			sleep(7);
		}
		
		if ($count > 0) {
			$data = DB::table(Message::$TABLE)
				->join(User::$TABLE, User::$TABLE . '.id','=', Message::$TABLE . '.user_id')
				->select(Message::$TABLE . '.id', User::$TABLE . '.email', Message::$TABLE . '.message', Message::$TABLE . '.created_at')
				->where(Message::$TABLE . '.created_at', '>', DB::RAW($timelimit))
				->get();
		}
		
		return Response::json(compact('count', 'data', 'timelimit'));
		

	}

	/**
	 * Parse int timestamp into RAW query string
	 * @param  int $timestamp timestamp
	 * @return string            RaW query string
	 */
	private function getTimeQuery($timestamp = null) {
		if ($timestamp == null) {
			$timestamp = "NOW()";
		} else {
			$timestamp = "FROM_UNIXTIME(" . $timestamp . ")";
		}
		return $timestamp;
	}
}

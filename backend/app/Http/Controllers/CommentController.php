<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\Request;

class CommentController extends Controller
{
	public function index(Request $request, Task $task)
	{
		abort_unless($request->user()->team_id === $task->team_id, 403);
		return response()->json($task->comments()->with('user')->latest()->get());
	}

	public function store(Request $request, Task $task)
	{
		abort_unless($request->user()->team_id === $task->team_id, 403);
		$data = $request->validate([
			'body' => ['required','string'],
		]);
		$comment = $task->comments()->create([
			'user_id' => $request->user()->id,
			'body' => $data['body'],
		]);
		return response()->json($comment->load('user'), 201);
	}

	public function destroy(Request $request, Comment $comment)
	{
		abort_unless($request->user()->team_id === $comment->task->team_id, 403);
		abort_unless($request->user()->id === $comment->user_id || $request->user()->role === 'admin', 403);
		$comment->delete();
		return response()->noContent();
	}
}

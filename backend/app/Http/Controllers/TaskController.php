<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;

class TaskController extends Controller
{
	public function index(Request $request)
	{
		$user = $request->user();
		$tasks = Task::where('team_id', $user->team_id)->with(['project','assignedUser'])->get();
		return response()->json($tasks);
	}

	public function indexByProject(Request $request, Project $project)
	{
		$user = $request->user();
		abort_unless($project->team_id === $user->team_id, 403);
		$tasks = Task::where('team_id', $user->team_id)->where('project_id', $project->id)
			->with(['assignedUser'])->get();
		return response()->json($tasks);
	}

	public function store(Request $request)
	{
		$user = $request->user();
		$data = $request->validate([
			'project_id' => ['required','exists:projects,id'],
			'title' => ['required','string','max:255'],
			'description' => ['nullable','string'],
			'due_date' => ['nullable','date'],
			'priority' => ['nullable','in:low,medium,high'],
			'status' => ['nullable','in:not_started,in_progress,completed'],
			'assigned_user_id' => ['nullable','exists:users,id'],
		]);
		$project = Project::findOrFail($data['project_id']);
		abort_unless($project->team_id === $user->team_id, 403);
		if (!empty($data['assigned_user_id'])) {
			$assignee = User::findOrFail($data['assigned_user_id']);
			abort_unless($assignee->team_id === $user->team_id, 403);
		}
		$task = Task::create(array_merge($data, ['team_id' => $user->team_id]));
		return response()->json($task, 201);
	}

	public function show(Request $request, Task $task)
	{
		$this->authorize('view', $task);
		return response()->json($task->load(['project','assignedUser','comments.user']));
	}

	public function update(Request $request, Task $task)
	{
		$this->authorize('update', $task);
		$data = $request->validate([
			'title' => ['sometimes','string','max:255'],
			'description' => ['nullable','string'],
			'due_date' => ['nullable','date'],
			'priority' => ['nullable','in:low,medium,high'],
			'status' => ['nullable','in:not_started,in_progress,completed'],
			'assigned_user_id' => ['nullable','exists:users,id'],
		]);
		if (!empty($data['assigned_user_id'])) {
			$assignee = User::findOrFail($data['assigned_user_id']);
			abort_unless($assignee->team_id === $task->team_id, 403);
		}
		$task->update($data);
		return response()->json($task);
	}

	public function updateStatus(Request $request, Task $task)
	{
		$this->authorize('update', $task);
		$data = $request->validate([
			'status' => ['required','in:not_started,in_progress,completed'],
		]);
		$task->update(['status' => $data['status']]);
		return response()->json($task);
	}

	public function assignUser(Request $request, Task $task)
	{
		$this->authorize('update', $task);
		$data = $request->validate([
			'assigned_user_id' => ['required','exists:users,id'],
		]);
		$assignee = User::findOrFail($data['assigned_user_id']);
		abort_unless($assignee->team_id === $task->team_id, 403);
		$task->update(['assigned_user_id' => $assignee->id]);
		return response()->json($task);
	}

	public function destroy(Request $request, Task $task)
	{
		$this->authorize('delete', $task);
		$task->delete();
		return response()->noContent();
	}
}

<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
	public function index(Request $request)
	{
		$user = $request->user();
		$projects = Project::where('team_id', $user->team_id)->withCount('tasks')->get();
		return response()->json($projects);
	}

	public function store(Request $request)
	{
		$user = $request->user();
		$this->authorize('create', Project::class);
		$data = $request->validate([
			'name' => ['required','string','max:255'],
			'description' => ['nullable','string'],
		]);
		$project = Project::create([
			'team_id' => $user->team_id,
			'name' => $data['name'],
			'description' => $data['description'] ?? null,
		]);
		return response()->json($project, 201);
	}

	public function show(Request $request, Project $project)
	{
		$this->authorize('view', $project);
		return response()->json($project->load('tasks'));
	}

	public function update(Request $request, Project $project)
	{
		$this->authorize('update', $project);
		$data = $request->validate([
			'name' => ['sometimes','string','max:255'],
			'description' => ['nullable','string'],
		]);
		$project->update($data);
		return response()->json($project);
	}

	public function destroy(Request $request, Project $project)
	{
		$this->authorize('delete', $project);
		$project->delete();
		return response()->noContent();
	}
}

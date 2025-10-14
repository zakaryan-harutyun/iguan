<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
	public function showMyTeam(Request $request)
	{
		$user = $request->user();
		$team = $user->team()->with('projects')->first();
		return response()->json($team);
	}

	public function store(Request $request)
	{
		$data = $request->validate([
			'name' => ['required','string','max:255'],
		]);
		$team = Team::create(['name' => $data['name']]);
		$user = $request->user();
		$user->update(['team_id' => $team->id, 'role' => 'admin']);
		return response()->json($team, 201);
	}

	public function users(Request $request)
	{
		$user = $request->user();
		$users = $user->team ? $user->team->users()->select('id','name','email','role')->get() : collect([]);
		return response()->json($users);
	}
}

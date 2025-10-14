<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Team;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'team_mode' => ['required','in:create,join'],
            'team_name' => ['required_if:team_mode,create','nullable','string','max:255'],
            'team_id' => ['required_if:team_mode,join','nullable','exists:teams,id'],
        ]);

        $teamId = null;
        $role = 'member';
        if ($validated['team_mode'] === 'create') {
            $team = Team::create(['name' => $validated['team_name']]);
            $teamId = $team->id;
            $role = 'admin';
        } else {
            $teamId = (int) $validated['team_id'];
            $role = 'member';
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($request->string('password')),
            'team_id' => $teamId,
            'role' => $role,
        ]);

        event(new Registered($user));

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }
}

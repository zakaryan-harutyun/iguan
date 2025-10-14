<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ProjectPolicy
{ 
    public function viewAny(User $user): bool
    {
        return (bool) $user->team_id;
    }

    public function view(User $user, Project $project): bool
    {
        return $user->team_id === $project->team_id;
    }

    public function create(User $user): bool
    {
        return (bool) $user->team_id;
    }

    public function update(User $user, Project $project): bool
    {
        return $user->team_id === $project->team_id && $user->role === 'admin';
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->team_id === $project->team_id && $user->role === 'admin';
    }

    public function restore(User $user, Project $project): bool
    {
        return false;
    }

    public function forceDelete(User $user, Project $project): bool
    {
        return false;
    }
}

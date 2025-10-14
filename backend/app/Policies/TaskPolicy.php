<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TaskPolicy
{

    public function viewAny(User $user): bool
    {
        return (bool) $user->team_id;
    }

    public function view(User $user, Task $task): bool
    {
        return $user->team_id === $task->team_id;
    }

    public function create(User $user): bool
    {
        return (bool) $user->team_id; 
    }

    public function update(User $user, Task $task): bool
    {
        return $user->team_id === $task->team_id; 
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->team_id === $task->team_id && $user->role === 'admin';
    }

    public function restore(User $user, Task $task): bool
    {
        return false;
    }

    public function forceDelete(User $user, Task $task): bool
    {
        return false;
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Team;
use App\Models\User;
use App\Models\Project;
use App\Models\Task;

class DemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $team = Team::create(['name' => 'Acme Team']);

        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'team_id' => $team->id,
            'role' => 'admin',
        ]);

        $member = User::create([
            'name' => 'Member User',
            'email' => 'member@example.com',
            'password' => bcrypt('password'),
            'team_id' => $team->id,
            'role' => 'member',
        ]);

        $projectA = Project::create([
            'team_id' => $team->id,
            'name' => 'Project Alpha',
            'description' => 'First project',
        ]);
        $projectB = Project::create([
            'team_id' => $team->id,
            'name' => 'Project Beta',
            'description' => 'Second project',
        ]);

        foreach ([$projectA, $projectB] as $project) {
            Task::create([
                'team_id' => $team->id,
                'project_id' => $project->id,
                'assigned_user_id' => $admin->id,
                'title' => $project->name.' - Task 1',
                'description' => 'Kickoff',
                'priority' => 'high',
                'status' => 'in_progress',
            ]);
            Task::create([
                'team_id' => $team->id,
                'project_id' => $project->id,
                'assigned_user_id' => $member->id,
                'title' => $project->name.' - Task 2',
                'description' => 'Follow-up',
                'priority' => 'medium',
                'status' => 'not_started',
            ]);
        }
    }
}

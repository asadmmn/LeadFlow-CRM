<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskActivityApiTest extends TestCase
{
    use RefreshDatabase;

    private function owner(string $email = 'tasks@example.test'): User
    {
        return User::create(['name' => 'Task Owner', 'email' => $email, 'password' => 'long-test-password', 'role' => 'sales']);
    }

    public function test_user_can_create_complete_and_list_tasks_for_their_leads(): void
    {
        $user = $this->owner();
        $lead = $user->leads()->create(['first_name' => 'Taylor', 'status' => 'new']);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/tasks', [
            'lead_id' => $lead->id, 'title' => 'Send proposal', 'priority' => 'high', 'due_at' => now()->addDay()->toISOString(),
        ])->assertCreated()->assertJsonPath('data.title', 'Send proposal');

        $taskId = $user->tasks()->firstOrFail()->id;
        $this->patchJson("/api/v1/tasks/{$taskId}", ['status' => 'completed'])
            ->assertOk()->assertJsonPath('data.status', 'completed');
        $this->getJson('/api/v1/tasks?status=done')->assertOk()->assertJsonPath('data.0.title', 'Send proposal');
    }

    public function test_tasks_cannot_be_created_for_another_users_lead_or_accessed_by_another_user(): void
    {
        $owner = $this->owner();
        $lead = $owner->leads()->create(['first_name' => 'Private lead', 'status' => 'new']);
        Sanctum::actingAs($this->owner('other-tasks@example.test'));

        $this->postJson('/api/v1/tasks', ['lead_id' => $lead->id, 'title' => 'Unauthorized task'])->assertUnprocessable();
        $this->getJson('/api/v1/tasks')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_user_can_add_and_read_lead_activity(): void
    {
        $user = $this->owner();
        $lead = $user->leads()->create(['first_name' => 'Morgan', 'status' => 'contacted']);
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/leads/{$lead->id}/activities", [
            'type' => 'call', 'title' => 'Discovery call', 'body' => 'Discussed project requirements.',
        ])->assertCreated()->assertJsonPath('data.type', 'call');

        $this->getJson("/api/v1/leads/{$lead->id}/activities")
            ->assertOk()->assertJsonPath('data.0.title', 'Discovery call');
    }

    public function test_viewer_can_read_tasks_but_cannot_create_or_log_activities(): void
    {
        $viewer = $this->owner('viewer-tasks@example.test');
        $viewer->update(['role' => 'viewer']);
        $lead = $viewer->leads()->create(['first_name' => 'Read only', 'status' => 'new']);
        Sanctum::actingAs($viewer);

        $this->getJson('/api/v1/tasks')->assertOk();
        $this->postJson('/api/v1/tasks', ['lead_id' => $lead->id, 'title' => 'Blocked'])->assertForbidden();
        $this->postJson("/api/v1/leads/{$lead->id}/activities", ['type' => 'note', 'title' => 'Blocked'])->assertForbidden();
    }
}

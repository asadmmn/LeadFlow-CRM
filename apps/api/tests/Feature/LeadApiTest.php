<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeadApiTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $email = 'owner@example.test'): User
    {
        return User::create(['name' => 'Workspace Owner', 'email' => $email, 'password' => 'long-test-password']);
    }

    public function test_health_endpoint_returns_ok(): void
    {
        $this->getJson('/api/v1/health')->assertOk()->assertJsonPath('status', 'ok');
    }

    public function test_registration_and_login_issue_api_tokens(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Amina Khan', 'email' => 'amina@example.test',
            'password' => 'strong-password-123', 'password_confirmation' => 'strong-password-123',
        ])->assertCreated()->assertJsonStructure(['user' => ['id', 'name', 'role'], 'token']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'amina@example.test', 'password' => 'strong-password-123',
        ])->assertOk()->assertJsonStructure(['user' => ['id', 'email'], 'token']);
    }

    public function test_leads_require_authentication(): void
    {
        $this->getJson('/api/v1/leads')->assertUnauthorized();
    }

    public function test_a_user_can_create_and_list_their_leads(): void
    {
        Sanctum::actingAs($this->user());

        $this->postJson('/api/v1/leads', [
            'first_name' => 'Amina', 'last_name' => 'Khan', 'company' => 'Northstar Studio',
            'email' => 'amina@example.test', 'status' => 'qualified', 'value' => 1200,
        ])->assertCreated()->assertJsonPath('data.first_name', 'Amina');

        $this->getJson('/api/v1/leads')->assertOk()->assertJsonPath('data.0.company', 'Northstar Studio');
        $this->getJson('/api/v1/dashboard/stats')->assertOk()->assertJsonPath('total_leads', 1);
    }

    public function test_invalid_lead_data_is_rejected(): void
    {
        Sanctum::actingAs($this->user());
        $this->postJson('/api/v1/leads', ['first_name' => '', 'status' => 'unknown'])
            ->assertUnprocessable()->assertJsonValidationErrors(['first_name', 'status']);
    }

    public function test_users_cannot_read_or_change_another_users_leads(): void
    {
        $owner = $this->user();
        $lead = $owner->leads()->create(['first_name' => 'Private', 'status' => 'new']);
        Sanctum::actingAs($this->user('other@example.test'));

        $this->getJson("/api/v1/leads/{$lead->id}")->assertNotFound();
        $this->patchJson("/api/v1/leads/{$lead->id}", ['status' => 'won'])->assertNotFound();
    }

    public function test_viewer_can_read_but_cannot_create_leads(): void
    {
        $viewer = $this->user('viewer@example.test');
        $viewer->update(['role' => 'viewer']);
        Sanctum::actingAs($viewer);

        $this->getJson('/api/v1/leads')->assertOk();
        $this->postJson('/api/v1/leads', ['first_name' => 'Blocked'])->assertForbidden();
    }

    public function test_lead_can_be_updated_and_deleted(): void
    {
        $user = $this->user();
        $lead = $user->leads()->create(['first_name' => 'Sam', 'status' => 'new']);
        Sanctum::actingAs($user);

        $this->patchJson("/api/v1/leads/{$lead->id}", ['status' => 'won'])->assertOk()->assertJsonPath('data.status', 'won');
        $this->deleteJson("/api/v1/leads/{$lead->id}")->assertNoContent();
    }
}

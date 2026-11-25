<?php

namespace Tests\Feature;

use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_returns_ok(): void
    {
        $this->getJson('/api/v1/health')->assertOk()->assertJsonPath('status', 'ok');
    }

    public function test_a_lead_can_be_created_and_listed(): void
    {
        $this->postJson('/api/v1/leads', [
            'first_name' => 'Amina', 'last_name' => 'Khan', 'company' => 'Northstar Studio',
            'email' => 'amina@example.test', 'status' => 'qualified', 'value' => 1200,
        ])->assertCreated()->assertJsonPath('data.first_name', 'Amina');

        $this->getJson('/api/v1/leads')->assertOk()->assertJsonPath('data.0.company', 'Northstar Studio');
    }

    public function test_invalid_lead_data_is_rejected(): void
    {
        $this->postJson('/api/v1/leads', ['first_name' => '', 'status' => 'unknown'])
            ->assertUnprocessable()->assertJsonValidationErrors(['first_name', 'status']);
    }

    public function test_lead_can_be_updated_and_deleted(): void
    {
        $lead = Lead::create(['first_name' => 'Sam', 'status' => 'new']);
        $this->patchJson("/api/v1/leads/{$lead->id}", ['status' => 'won'])->assertOk()->assertJsonPath('data.status', 'won');
        $this->deleteJson("/api/v1/leads/{$lead->id}")->assertNoContent();
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LeadActivity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeadActivityController extends Controller
{
    public function index(Request $request, int $lead): JsonResponse
    {
        $request->user()->leads()->findOrFail($lead);
        return response()->json(LeadActivity::where('user_id', $request->user()->id)
            ->where('lead_id', $lead)->latest('occurred_at')->paginate(50));
    }

    public function store(Request $request, int $lead): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['admin', 'sales'], true), 403);
        $request->user()->leads()->findOrFail($lead);
        $data = $request->validate([
            'type' => ['sometimes', Rule::in(['note', 'call', 'email', 'meeting', 'status'])],
            'title' => ['required', 'string', 'max:180'],
            'body' => ['nullable', 'string', 'max:5000'],
            'occurred_at' => ['sometimes', 'date'],
        ]);
        $activity = LeadActivity::create([...$data, 'user_id' => $request->user()->id, 'lead_id' => $lead]);
        return response()->json(['data' => $activity], 201);
    }
}
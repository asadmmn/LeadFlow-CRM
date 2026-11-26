<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $leads = $request->user()->leads()
            ->when($request->filled('search'), function ($query) use ($request): void {
                $term = '%'.$request->string('search')->toString().'%';
                $query->where(fn ($q) => $q->where('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhere('company', 'like', $term)
                    ->orWhere('email', 'like', $term));
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()->paginate(min(max($request->integer('per_page', 50), 1), 100));

        return response()->json($leads);
    }

    public function stats(Request $request): JsonResponse
    {
        $query = $request->user()->leads();
        $leads = (clone $query)->get();
        $open = $leads->whereNotIn('status', ['won', 'lost']);

        return response()->json([
            'total_leads' => $leads->count(),
            'pipeline_value' => (float) $open->sum('value'),
            'won_value' => (float) $leads->where('status', 'won')->sum('value'),
            'open_leads' => $open->count(),
            'won_leads' => $leads->where('status', 'won')->count(),
            'conversion_rate' => $leads->count() ? round($leads->where('status', 'won')->count() / $leads->count() * 100, 1) : 0,
            'stages' => collect(Lead::STATUSES)->mapWithKeys(fn ($status) => [$status => $leads->where('status', $status)->count()]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureCanManage($request);
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'company' => ['nullable', 'string', 'max:160'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'source' => ['nullable', 'string', 'max:80'],
            'status' => ['sometimes', Rule::in(Lead::STATUSES)],
            'value' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'follow_up_at' => ['nullable', 'date'],
        ]);

        return response()->json(['data' => $request->user()->leads()->create($validated)], 201);
    }

    public function show(Request $request, int $lead): JsonResponse
    {
        return response()->json(['data' => $request->user()->leads()->findOrFail($lead)]);
    }

    public function update(Request $request, int $lead): JsonResponse
    {
        $this->ensureCanManage($request);
        $record = $request->user()->leads()->findOrFail($lead);
        $validated = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'company' => ['sometimes', 'nullable', 'string', 'max:160'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'source' => ['sometimes', 'nullable', 'string', 'max:80'],
            'status' => ['sometimes', Rule::in(Lead::STATUSES)],
            'value' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999999999'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'follow_up_at' => ['sometimes', 'nullable', 'date'],
        ]);

        $record->update($validated);
        return response()->json(['data' => $record->refresh()]);
    }

    public function destroy(Request $request, int $lead): JsonResponse
    {
        $this->ensureCanManage($request);
        $request->user()->leads()->findOrFail($lead)->delete();
        return response()->json(status: 204);
    }

    private function ensureCanManage(Request $request): void
    {
        abort_unless(in_array($request->user()->role, ['admin', 'sales'], true), 403, 'Your role cannot modify leads.');
    }
}

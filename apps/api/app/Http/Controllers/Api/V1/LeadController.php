<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $leads = Lead::query()
            ->when($request->filled('search'), function ($query) use ($request): void {
                $term = '%'.$request->string('search')->toString().'%';
                $query->where(fn ($q) => $q->where('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhere('company', 'like', $term)
                    ->orWhere('email', 'like', $term));
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json($leads);
    }

    public function store(Request $request): JsonResponse
    {
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

        return response()->json(['data' => Lead::create($validated)], 201);
    }

    public function show(Lead $lead): JsonResponse
    {
        return response()->json(['data' => $lead]);
    }

    public function update(Request $request, Lead $lead): JsonResponse
    {
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

        $lead->update($validated);
        return response()->json(['data' => $lead->refresh()]);
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();
        return response()->json(status: 204);
    }
}

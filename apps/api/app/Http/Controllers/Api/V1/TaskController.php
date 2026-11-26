<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tasks = Task::query()->where('user_id', $request->user()->id)
            ->with('lead:id,first_name,last_name,company')
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->orderByRaw('CASE WHEN status = ? THEN 0 ELSE 1 END', ['open'])
            ->orderByRaw('due_at IS NULL')->orderBy('due_at')->latest()->paginate(50);

        return response()->json($tasks);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['admin', 'sales'], true), 403);
        $data = $request->validate([
            'lead_id' => ['required', 'integer', Rule::exists('leads', 'id')->where('user_id', $request->user()->id)],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:3000'],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'due_at' => ['nullable', 'date'],
        ]);
        $task = Task::create([...$data, 'user_id' => $request->user()->id]);
        return response()->json(['data' => $task->load('lead:id,first_name,last_name,company')], 201);
    }

    public function update(Request $request, int $task): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['admin', 'sales'], true), 403);
        $record = Task::where('user_id', $request->user()->id)->findOrFail($task);
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:180'],
            'description' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'status' => ['sometimes', Rule::in(['open', 'done'])],
            'due_at' => ['sometimes', 'nullable', 'date'],
        ]);
        if (($data['status'] ?? null) === 'done') $data['completed_at'] = now();
        if (($data['status'] ?? null) === 'open') $data['completed_at'] = null;
        $record->update($data);
        return response()->json(['data' => $record->refresh()->load('lead:id,first_name,last_name,company')]);
    }

    public function destroy(Request $request, int $task): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['admin', 'sales'], true), 403);
        Task::where('user_id', $request->user()->id)->findOrFail($task)->delete();
        return response()->json(status: 204);
    }
}
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tasks = $request->user()->tasks()->with('lead:id,first_name,last_name,company')->orderByRaw('completed_at IS NOT NULL')->orderBy('due_at')->paginate(100);
        return response()->json($tasks);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['admin', 'sales'], true), 403);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:5000'],
            'due_at' => ['nullable', 'date'],
            'lead_id' => ['nullable', 'integer', Rule::exists('leads', 'id')->where('user_id', $request->user()->id)],
        ]);
        $task = $request->user()->tasks()->create($data);
        return response()->json(['data' => $task->load('lead:id,first_name,last_name,company')], 201);
    }

    public function update(Request $request, int $task): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['admin', 'sales'], true), 403);
        $record = $request->user()->tasks()->findOrFail($task);
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:180'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'due_at' => ['sometimes', 'nullable', 'date'],
            'lead_id' => ['sometimes', 'nullable', 'integer', Rule::exists('leads', 'id')->where('user_id', $request->user()->id)],
            'completed' => ['sometimes', 'boolean'],
        ]);
        if (array_key_exists('completed', $data)) {
            $data['completed_at'] = $data['completed'] ? now() : null;
            unset($data['completed']);
        }
        $record->update($data);
        return response()->json(['data' => $record->refresh()->load('lead:id,first_name,last_name,company')]);
    }

    public function destroy(Request $request, int $task): JsonResponse
    {
        abort_unless(in_array($request->user()->role, ['admin', 'sales'], true), 403);
        $request->user()->tasks()->findOrFail($task)->delete();
        return response()->json(status: 204);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadActivityController extends Controller
{
    public function index(Request $request, int $lead): JsonResponse
    {
        $request->user()->leads()->findOrFail($lead);
        return response()->json($request->user()->activities()->where('lead_id', $lead)->latest()->paginate(100));
    }
}

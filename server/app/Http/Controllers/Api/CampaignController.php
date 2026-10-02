<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    // Saari campaigns fetch karna
    public function index()
    {
        $campaigns = Campaign::orderBy('created_at', 'DESC')->get();

        return response()->json([
            'status' => true,
            'data' => $campaigns
        ], 200);
    }

    // Nayi campaign banana
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'budget' => 'required|numeric|min:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $campaign = Campaign::create([
            'name' => $request->name,
            'type' => $request->type,
            'budget' => $request->budget,
            'spent' => 0.00,
            'status' => 'Active',
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Marketing campaign created successfully!',
            'data' => $campaign
        ], 201);
    }

    // Campaign status toggle karna (Active <-> Paused)
    public function updateStatus($id)
    {
        $campaign = Campaign::findOrFail($id);
        $campaign->status = $campaign->status === 'Active' ? 'Paused' : 'Active';
        $campaign->save();

        return response()->json([
            'status' => true,
            'message' => 'Campaign status updated!',
            'data' => $campaign
        ], 200);
    }

    // Campaign delete karna
    public function destroy($id)
    {
        $campaign = Campaign::findOrFail($id);
        $campaign->delete();

        return response()->json([
            'status' => true,
            'message' => 'Campaign deleted successfully!'
        ], 200);
    }
}
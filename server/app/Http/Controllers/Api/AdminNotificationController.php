<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminNotification;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => AdminNotification::latest()->limit(30)->get(),
            'unread_count' => AdminNotification::whereNull('read_at')->count(),
        ]);
    }

    public function markAsRead($id)
    {
        $notification = AdminNotification::find($id);

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found.',
            ], 404);
        }

        $notification->update([
            'read_at' => $notification->read_at ?? now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    public function markAllAsRead()
    {
        AdminNotification::whereNull('read_at')->update([
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class StaffUserController extends Controller
{
    /**
     * Get all staff / admins along with their roles and permissions.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $staff = User::where('role', '!=', 'customer')
                     ->with('roles', 'permissions')
                     ->orderBy('created_at', 'DESC')
                     ->get();
                     
        return response()->json(['status' => true, 'data' => $staff], 200);
    }

    /**
     * Store a new staff member with Spatie Role and Permissions integration.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'required|string',
            'permissions' => 'nullable|array',
        ]);

        // Create user with active status and specified role column value
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => 'active',
        ]);

        // Assign role using Spatie package
        if ($request->filled('role')) {
            $user->assignRole($request->role);
        }

        // Safely check and sync permissions, creating missing ones automatically if needed
        if ($request->has('permissions') && is_array($request->permissions)) {
            $validPermissions = [];
            foreach ($request->permissions as $permName) {
                // Ensure permission exists in database to prevent guard errors
                Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'sanctum']);
                $validPermissions[] = $permName;
            }
            $user->syncPermissions($validPermissions);
        }

        return response()->json([
            'status' => true,
            'message' => 'Staff user created successfully!',
            'data' => $user->load('roles', 'permissions')
        ], 201);
    }

    /**
     * Update staff member details, roles, and permissions safely.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id) 
    {
        // 1. Find the staff member by ID or fail
        $staff = User::findOrFail($id);
        
        // 2. Update basic profile details and keep the role string column synced if passed
        $staff->update([
            'name' => $request->name,
            'email' => $request->email,
            ...(($request->filled('role')) ? ['role' => $request->role] : [])
        ]);

        // 3. Assign role using Spatie package
        if ($request->has('role')) {
            $staff->syncRoles([$request->role]); 
        }

        // 4. Safely check and sync permissions, creating missing ones automatically if needed
        if ($request->has('permissions') && is_array($request->permissions)) {
            $validPermissions = [];
            foreach ($request->permissions as $permName) {
                // Ensure permission exists in database to prevent guard errors
                Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'sanctum']);
                $validPermissions[] = $permName;
            }
            $staff->syncPermissions($validPermissions);
        } else {
            $staff->syncPermissions([]);
        }

        // 5. Return the updated user response with loaded roles and permissions
        return response()->json([
            'status' => true,
            'message' => 'Staff profile updated successfully',
            'user' => $staff->load('roles', 'permissions')
        ]);
    }

    /**
     * Delete staff member with Super Admin and self-deletion protection.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Security check: Prevent deleting own account
        if (auth()->id() == $id) {
            return response()->json([
                'status' => false,
                'message' => 'Security Error: You cannot delete your own account!'
            ], 403);
        }

        $roleLower = strtolower($user->role ?? '');
        
        // Security check: Prevent deleting Super Admin or primary owner account
        if (str_contains($roleLower, 'super') || strtolower($user->email) === 'admin@myshop.com') {
            return response()->json([
                'status' => false,
                'message' => 'Security Error: The Super Admin (Owner) account cannot be deleted!'
            ], 403);
        }

        $user->delete();

        return response()->json([
            'status' => true,
            'message' => 'Staff user deleted successfully!'
        ], 200);
    }
}
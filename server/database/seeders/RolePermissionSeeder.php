<?php

namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        // 1. Permissions Create  According to user side bar menu)
        $permissions = [
            'manage_orders', 'manage_returns', 'manage_shipments', 
            'view_customers', 'manage_reviews', 'manage_refunds',
            'manage_marketing', 'view_analytics', 'view_revenue',
            'manage_staff', 'manage_settings'
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // 2. Create Role and Assign persmission.
        $superAdmin = Role::create(['name' => 'Super Admin']);
        // Super Admin gets everything via a Gate rule (set in AuthServiceProvider), but let's assign all for now:
        $superAdmin->syncPermissions(Permission::all());

        $orderManager = Role::create(['name' => 'Order Manager']);
        $orderManager->syncPermissions(['manage_orders', 'manage_returns', 'manage_shipments']);

        $customerSupport = Role::create(['name' => 'Customer Support']);
        $customerSupport->syncPermissions(['view_customers', 'manage_reviews', 'manage_refunds']);

        // 3. For Assign to Dummy users.
        $adminUser = User::find(1); // Apna admin ID 
        if($adminUser) { $adminUser->assignRole('Super Admin'); }
    }
}
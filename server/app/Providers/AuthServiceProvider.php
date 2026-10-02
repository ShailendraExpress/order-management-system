<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
   public function boot()
    {
        $this->registerPolicies();

        Gate::before(function ($user, $ability) {
            // Agar user ke paas 'Super Admin', 'super_admin' ya role column mein 'admin' hai, toh sab allow kar do
            if (
                $user->hasRole(['Super Admin', 'super_admin']) || 
                optional($user)->role === 'admin' || 
                optional($user)->role === 'super_admin'
            ) {
                return true;
            }
            
            return null;
        });
    }
}

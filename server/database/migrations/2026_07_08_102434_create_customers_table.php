<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            // 1. Account Info
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone');
            $table->string('password');
            
            // 2. Demographics
            $table->string('gender')->nullable();
            $table->date('dob')->nullable();
            $table->string('customer_group')->default('Regular'); // Regular, VIP, Wholesale
            
            // 3. Address
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('pincode')->nullable();
            $table->string('country')->default('India');
            
            // 4. Status Toggles
            $table->boolean('is_active')->default(true);
            $table->boolean('email_verified')->default(false);
            $table->boolean('newsletter')->default(true);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
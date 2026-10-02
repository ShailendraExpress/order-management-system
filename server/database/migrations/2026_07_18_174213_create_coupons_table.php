<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g. SUMMER50
            $table->enum('discount_type', ['percentage', 'fixed']);
            $table->decimal('discount_value', 10, 2);
            $table->decimal('min_order_amount', 10, 2)->nullable();
            $table->integer('usage_limit')->nullable(); // Kitni baar use ho sakta hai
            $table->integer('used_count')->default(0); // Kitni baar use ho chuka hai
            $table->date('expiry_date');
            $table->string('status')->default('Active'); // Active, Draft, Expired
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('coupons');
    }
};
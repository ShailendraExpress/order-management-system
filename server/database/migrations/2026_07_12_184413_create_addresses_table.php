<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAddressesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            // Foreign key to link address with the logged-in user/customer
            // Note: If your users table is named 'customers', change 'users' to 'customers' below
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            
            $table->string('address_line');
            $table->string('city');
            $table->string('state');
            $table->string('pincode');
            $table->string('type')->default('home'); // 'home' or 'work'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('addresses');
    }
}

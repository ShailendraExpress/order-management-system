<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateReturnRequestsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('return_requests', function (Blueprint $table) {
            $table->id();
            // Linking IDs
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->unsignedBigInteger('item_id'); // ID from order_items table
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('customer_id');
            
            // Return Details
            $table->integer('quantity');
            $table->string('action'); // 'refund' or 'replacement'
            $table->string('reason');
            $table->text('comment')->nullable();
            
            // To store multiple image paths as a JSON array
            $table->json('images')->nullable(); 
            
            // Default status is pending for admin approval
            $table->string('status')->default('pending'); // pending, approved, rejected
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
        Schema::dropIfExists('return_requests');
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
        
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade'); 
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            
            $table->integer('rating'); // 1 to 5 stars
            $table->string('headline')->nullable(); // "Very Good Product"
            $table->text('comment')->nullable(); // Detailed review
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('reviews');
    }
};
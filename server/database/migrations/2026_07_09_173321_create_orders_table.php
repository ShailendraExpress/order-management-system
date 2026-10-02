<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            // 'customer_id' reference: agar 'customers' table hai toh constrained() kaam karega
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->string('order_number')->unique();
            $table->decimal('total_price', 10, 2);
            $table->string('status')->default('pending'); // pending, processing, delivered, cancelled
            $table->string('payment_method'); // cod, upi, card
            $table->string('payment_status')->default('unpaid'); // unpaid, paid
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
        Schema::dropIfExists('orders');
    }
}

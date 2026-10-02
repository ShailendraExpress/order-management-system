<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInvoicesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique(); // e.g., INV-2026-1001
            $table->unsignedBigInteger('order_id'); // Orders table se connection
            $table->unsignedBigInteger('customer_id'); // User/Customer ID
            
            $table->decimal('total_amount', 10, 2); // Invoice ka total bill
            $table->decimal('tax_amount', 10, 2); // Total tax kitna laga
            
            $table->string('status')->default('Pending'); // Paid, Pending, Refunded
            $table->date('issued_date')->nullable(); // Jis din bill bana
            
            $table->timestamps();

            // Note: 
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('invoices');
    }
}

<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->onDelete('cascade');
            $table->string('carrier'); 
            $table->string('tracking_id')->nullable(); // AWB Number
            $table->string('shipment_id')->nullable(); // Shiprocket ka ID
            $table->string('status')->default('Processing');
            $table->float('weight')->nullable();
            $table->string('dimensions')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('shipments');
    }
};
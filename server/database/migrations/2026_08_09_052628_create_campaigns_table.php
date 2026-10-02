<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCampaignsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name'); //
            $table->string('type')->default('Sponsored Product'); // Sponsored Product, Banner Ad
            $table->decimal('budget', 10, 2); // Total budget allocated
            $table->decimal('spent', 10, 2)->default(0.00); //
            $table->string('status')->default('Active'); // Active, Paused, Completed
            $table->date('start_date');
            $table->date('end_date');
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
        Schema::dropIfExists('campaigns');
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddNotesToReturnRequestsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('return_requests', function (Blueprint $table) {
            //
            $table->text('admin_note')->nullable()->after('status');
        $table->text('customer_message')->nullable()->after('admin_note');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('return_requests', function (Blueprint $table) {
            $table->dropColumn(['admin_note', 'customer_message']);
        });
    }
}

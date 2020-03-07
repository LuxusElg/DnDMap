<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AlterMapLocationsAddSizeVisibility extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('map_locations', function (Blueprint $table) {
			$table->integer('size')->default(50);
			$table->unsignedBigInteger('campaign_id')->nullable()->default(null);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('map_locations', function (Blueprint $table) {
			$table->dropColumn('size');
			$table->dropColumn('campaign_id');
        });
    }
}

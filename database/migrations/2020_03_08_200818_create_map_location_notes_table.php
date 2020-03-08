<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMapLocationNotesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('map_location_notes', function (Blueprint $table) {
			$table->id();
			$table->unsignedBigInteger('map_location_id')->nullable()->default(null);
			$table->string('title')->default('');
			$table->longText('content');
			$table->unsignedBigInteger('user_id')->nullable()->default(null);
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
        Schema::dropIfExists('map_location_notes');
    }
}

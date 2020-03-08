<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MapLocationNote extends Model
{
	protected $fillable = [
		'map_location_id',
		'title',
		'content',
		'user_id',
	];

	public function author() {
		return $this->belongsTo(User::class);
	}
	public function location() {
		return $this->belongsTo(MapLocation::class);
	}
}

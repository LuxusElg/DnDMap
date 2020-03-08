<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TimelineEvent extends Model
{
    protected $fillable = [
		'campaign_id',
		'start_offset',
		'location_id',
		'title',
		'content',
	];

	public function setStartOffsetAttribute($value) {
		$this->attributes['start_offset'] = $value;
	}
	public function getStartOffsetAttribute($value) {
		return $this->attributes['start_offset'];
	}

	public function campaign() {
		return $this->belongsTo(Campaign::class);
	}
	public function location() {
		return $this->belongsTo(MapLocation::class);
	}
    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where('name', 'like', '%'.$search.'%');
        })->when($filters['trashed'] ?? null, function ($query, $trashed) {
            if ($trashed === 'with') {
                $query->withTrashed();
            } elseif ($trashed === 'only') {
                $query->onlyTrashed();
            }
        });
	}
	public static function dateToOffset($date) {
		return $date;
	}
}

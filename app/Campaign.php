<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campaign extends Model
{

	protected $fillable = [
		'name', 'dm_id', 'start',
	];

	public function setStartAttribute($value) {
		$this->attributes['start'] = $value;
	}
	public function getStartAttribute($value) {
		return $value;
	}

    public function players()
    {
        return $this->belongsToMany(User::class);
	}
	
	public function dm() {
		return $this->belongsTo(User::class, 'dm_id');
	}

	public function locations() {
		return $this->hasMany(MapLocation::class);
	}

	public function timelineEvents() {
		return $this->hasMany(TimelineEvent::class);
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
	
	public function toHarptos($day) {
		//
	}
}
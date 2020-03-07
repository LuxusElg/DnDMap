<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MapLocation extends Model
{
	protected $fillable = [
		'name',
		'pin_x',
		'pin_y',
		'size',
		'campaign_id'
	];	
	
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
	}

	public function visibleTo() {
		return $this->belongsToMany(User::class, 'location_user', 'location_id', 'user_id');
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
}
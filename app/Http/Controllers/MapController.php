<?php

namespace App\Http\Controllers;

use App\Campaign;
use App\MapLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MapController extends Controller
{
   	
    public function show()
    {
		$campaign = Campaign::first();
		if (Auth::user()->id == ($campaign->dm->id ?? null)) {
			$map = 'maps/scspoilermap.jpg';
		} else {
			$map = 'maps/scblankmap.jpg';
		}
        return Inertia::render('Map', [
			'map' => $map,
			'locations' => $campaign->locations,
        ]);
	}
}

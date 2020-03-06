<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class MapController extends Controller
{
   
    public function show()
    {
		$map = 'maps/swordcoast.jpg';
        return Inertia::render('Map', [
			'map' => $map,
        ]);
    }
}

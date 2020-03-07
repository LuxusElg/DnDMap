<?php

namespace App\Http\Controllers;

use App\Campaign;
use App\MapLocation;
use App\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Redirect;

class MapLocationsController extends Controller
{
    public function index()
    {
        return Inertia::render('MapLocations/Index', [
            'filters' => Request::all('search', 'trashed'),
            'maplocations' => MapLocation::
				orderBy('name')
				->with('campaign')
                ->filter(Request::only('search', 'trashed'))
                ->paginate(),
        ]);
    }

    public function create()
    {
        return Inertia::render('MapLocations/Create', [
			'campaigns' => Campaign::orderBy('name')->get()
		]);
    }

    public function store()
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        MapLocation::create(
            Request::validate([
				'name' => ['required', 'max:100'],
				'pin_x' => ['required'],
				'pin_y' => ['required'],
				'size' => ['required'],
				'campaign_id' => ['required'],
            ])
        );

        return Redirect::route('maplocations')->with('success', 'Map Location created.');
    }

    public function edit(MapLocation $maplocation)
    {
        return Inertia::render('MapLocations/Edit', [
            'maplocation' => [
                'id' => $maplocation->id,
                'name' => $maplocation->name,
				'visibleTo' => $maplocation->visibleTo()->orderByName()->get()->map->only('id', 'username'),
				'campaign' => $maplocation->campaign,
				'pin_x' => $maplocation->pin_x,
				'pin_y' => $maplocation->pin_y,
				'size' => $maplocation->size,
			],
			'campaigns' => Campaign::orderBy('name')->get(),
        ]);
    }

    public function update(MapLocation $maplocation)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        $maplocation->update(
            Request::validate([
                'name' => ['required', 'max:100'],
				'pin_x' => ['required'],
				'pin_y' => ['required'],
				'size' => ['required'],
				'campaign_id' => ['required'],
            ])
        );

        return Redirect::back()->with('success', 'Map Location updated.');
    }

    public function destroy(MapLocation $maplocation)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        $maplocation->delete();

        return Redirect::back()->with('success', 'Map Location deleted.');
    }

    public function restore(MapLocation $maplocation)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        $maplocation->restore();

        return Redirect::back()->with('success', 'Map Location restored.');
    }
}
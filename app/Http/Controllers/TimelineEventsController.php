<?php

namespace App\Http\Controllers;

use App\Campaign;
use App\MapLocation;
use App\TimelineEvent;
use App\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Redirect;

class TimelineEventsController extends Controller
{
    public function index()
    {
        return Inertia::render('TimelineEvents/Index', [
            'filters' => Request::all('search', 'trashed'),
            'timelineevents' => TimelineEvent::
				orderBy('title')
				->with('campaign')
				->with('location')
                ->filter(Request::only('search', 'trashed'))
                ->paginate(),
        ]);
    }

    public function create()
    {
        return Inertia::render('TimelineEvents/Create', [
			'campaigns' => Campaign::orderBy('name')->get(),
			'locations' => MapLocation::orderBy('name')->get(),
		]);
    }

    public function store()
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        TimelineEvent::create(
            Request::validate([
				'title' => ['required', 'max:255'],
				'content' => ['required'],
				'start_offset' => ['required'],
				'location_id' => ['required'],
				'campaign_id' => ['required'],
            ])
        );

        return Redirect::route('timelineevents')->with('success', 'Timeline Event created.');
    }

    public function edit(TimelineEvent $timelineevent)
    {
        return Inertia::render('TimelineEvents/Edit', [
            'timelineevent' => [
                'id' => $timelineevent->id,
                'title' => $timelineevent->title,
				'campaign' => $timelineevent->campaign,
				'location' => $timelineevent->location,
				'content' => $timelineevent->content,
				'start_offset' => $timelineevent->start_offset,
			],
			'campaigns' => Campaign::orderBy('name')->get(),
			'locations' => MapLocation::orderBy('name')->get(),
        ]);
    }

    public function update(TimelineEvent $timelineevent)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        $timelineevent->update(
            Request::validate([
				'title' => ['required', 'max:255'],
				'content' => ['required'],
				'start_offset' => ['required'],
				'location_id' => ['required'],
				'campaign_id' => ['required'],
            ])
        );

        return Redirect::back()->with('success', 'Timeline Event updated.');
    }

    public function destroy(TimelineEvent $timelineevent)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        $timelineevent->delete();

        return Redirect::back()->with('success', 'Timeline Event deleted.');
    }

    public function restore(TimelineEvent $timelineevent)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        $timelineevent->restore();

        return Redirect::back()->with('success', 'Timeline Event restored.');
    }
}
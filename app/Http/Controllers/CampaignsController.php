<?php

namespace App\Http\Controllers;

use App\Campaign;
use App\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Redirect;

class CampaignsController extends Controller
{
    public function index()
    {
        return Inertia::render('Campaigns/Index', [
            'filters' => Request::all('search', 'trashed'),
            'campaigns' => Campaign::
                orderBy('name')
                ->filter(Request::only('search', 'trashed'))
                ->paginate(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Campaigns/Create');
    }

    public function store()
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        Campaign::create(
            Request::validate([
                'name' => ['required', 'max:100'],
            ])
        );

        return Redirect::route('campaigns')->with('success', 'Campaign created.');
    }

    public function edit(Campaign $campaign)
    {
        return Inertia::render('Campaigns/Edit', [
            'campaign' => [
                'id' => $campaign->id,
                'name' => $campaign->name,
				'players' => $campaign->players()->orderByName()->get()->map->only('id', 'username'),
				'dm' => $campaign->dm
			],
			'filters' => Request::all('search'),
			'users' => User::
				whereDoesntHave('campaigns', function($query) use ($campaign) {
					$query->where('campaigns.id', $campaign->id);
				})
				->orderBy('username')
				->filter(Request::only('search'))
				->paginate(),
        ]);
    }

    public function update(Campaign $campaign)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        $campaign->update(
            Request::validate([
                'name' => ['required', 'max:100'],
            ])
        );

        return Redirect::back()->with('success', 'Campaign updated.');
    }

    public function addUser(Campaign $campaign)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
		$user = User::find(Request::only('user_id'))->first();
		if ($user) {
			$campaign->players()->attach($user);
			return Redirect::back()->with('success', 'User added to campaign.');
		}
		return Redirect::back()->with('error', 'User was not found!');

    }

    public function removeUser(Campaign $campaign)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
		$user = User::find(Request::only('user_id'))->first();
		if ($user) {
			$campaign->players()->detach($user);
			if (($campaign->dm->id ?? 0) === $user->id) {
				$campaign->update([
					'dm_id' => null
				]);
			}
			return Redirect::back()->with('success', 'User removed from campaign.');
		}
		return Redirect::back()->with('error', 'User was not found!');

    }

    public function setDm(Campaign $campaign)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
		$user = User::find(Request::only('user_id'))->first();
		if ($user) {

			$campaign->update([
				'dm_id' => $user->id
			]);
			return Redirect::back()->with('success', 'User set as DM for campaign.');
		}
		return Redirect::back()->with('error', 'User was not found!');

    }

    public function destroy(Campaign $campaign)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        $campaign->delete();

        return Redirect::back()->with('success', 'Campaign deleted.');
    }

    public function restore(Campaign $campaign)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        $campaign->restore();

        return Redirect::back()->with('success', 'Campaign restored.');
    }
}
<?php

namespace App\Http\Controllers;

use App\User;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\ValidationException;

class UsersController extends Controller
{
    public function index()
    {
        return Inertia::render('Users/Index', [
            'filters' => Request::all('search', 'role', 'trashed'),
			'users' => User::
				orderByName()
                ->filter(Request::only('search', 'role', 'trashed'))
                ->paginate(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Users/Create');
    }

    public function store()
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        Request::validate([
            'username' => ['required', 'max:50'],
            'email' => ['required', 'max:50', 'email', Rule::unique('users')],
			'password' => ['required'],
			'role' => ['required']
        ]);

        User::create([
            'username' => Request::get('username'),
            'email' => Request::get('email'),
            'password' => Hash::make(Request::get('password')),
            'role' => Request::get('role'),
        ]);

        return Redirect::route('users')->with('success', 'User created.');
    }

    public function edit(User $user)
    {
        return Inertia::render('Users/Edit', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function update(User $user)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        Request::validate([
            'username' => ['required', 'max:50'],
            'email' => ['required', 'max:50', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable'],
            'role' => ['required'],
        ]);

        $user->update(Request::only('username', 'email', 'role'));

        if (Request::get('password')) {
            $user->update(['password' => Hash::make(Request::get('password'))]);
        }

        return Redirect::back()->with('success', 'User updated.');
    }

    public function destroy(User $user)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        $user->delete();

        return Redirect::back()->with('success', 'User deleted.');
    }

    public function restore(User $user)
    {
		if (!Auth::user()->can('manage-application')) {
			return Redirect::back()->with('error', 'Insufficient privileges.');
		}
        $user->restore();

        return Redirect::back()->with('success', 'User restored.');
    }
}
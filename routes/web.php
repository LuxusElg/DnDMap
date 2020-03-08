<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Login
Route::get('login', 'Auth\LoginController@showLoginForm')->name('login');
Route::post('login', 'Auth\LoginController@login')->name('login.attempt');
Route::post('logout', 'Auth\LoginController@logout')->name('logout');
// Register
//Route::get('register', 'Auth\RegisterController@showRegistrationForm')->name('register');
//Route::post('register', 'Auth\RegisterController@register');


Route::group(['middleware' => ['auth']], function() {
	Route::get('/', 'HomeController@index')->name('home');
	Route::get('/map/{campaign}', 'MapController@show')->name('map');
	Route::resource('locations', 'MapLocationController');

	//Route::group(['middleware' => ['can:manage-application,']], function() {
		// Map Locations
		Route::get('maplocations')->name('maplocations')->uses('MapLocationsController@index');
		Route::get('maplocations/create')->name('maplocations.create')->uses('MapLocationsController@create');
		Route::post('maplocations')->name('maplocations.store')->uses('MapLocationsController@store');
		Route::get('maplocations/{maplocation}/edit')->name('maplocations.edit')->uses('MapLocationsController@edit');
		Route::put('maplocations/{maplocation}')->name('maplocations.update')->uses('MapLocationsController@update');
		Route::delete('maplocations/{maplocation}')->name('maplocations.destroy')->uses('MapLocationsController@destroy');
		Route::put('maplocations/{maplocation}/restore')->name('maplocations.restore')->uses('MapLocationsController@restore');
		// Timeline Events
		Route::get('timelineevents')->name('timelineevents')->uses('TimelineEventsController@index');
		Route::get('timelineevents/create')->name('timelineevents.create')->uses('TimelineEventsController@create');
		Route::post('timelineevents')->name('timelineevents.store')->uses('TimelineEventsController@store');
		Route::get('timelineevents/{timelineevent}/edit')->name('timelineevents.edit')->uses('TimelineEventsController@edit');
		Route::put('timelineevents/{timelineevent}')->name('timelineevents.update')->uses('TimelineEventsController@update');
		Route::delete('timelineevents/{timelineevent}')->name('timelineevents.destroy')->uses('TimelineEventsController@destroy');
		Route::put('timelineevents/{timelineevent}/restore')->name('timelineevents.restore')->uses('TimelineEventsController@restore');
		// Users
		Route::get('users')->name('users')->uses('UsersController@index');
		Route::get('users/create')->name('users.create')->uses('UsersController@create');
		Route::post('users')->name('users.store')->uses('UsersController@store');
		Route::get('users/{user}/edit')->name('users.edit')->uses('UsersController@edit');
		Route::put('users/{user}')->name('users.update')->uses('UsersController@update');
		Route::delete('users/{user}')->name('users.destroy')->uses('UsersController@destroy');
		Route::put('users/{user}/restore')->name('users.restore')->uses('UsersController@restore');
		// Campaigns
		Route::get('campaigns')->name('campaigns')->uses('CampaignsController@index');
		Route::get('campaigns/create')->name('campaigns.create')->uses('CampaignsController@create');
		Route::post('campaigns')->name('campaigns.store')->uses('CampaignsController@store');
		Route::get('campaigns/{campaign}/edit')->name('campaigns.edit')->uses('CampaignsController@edit');
		Route::put('campaigns/{campaign}')->name('campaigns.update')->uses('CampaignsController@update');
		Route::post('campaigns/{campaign}/adduser')->name('campaigns.adduser')->uses('CampaignsController@addUser');
		Route::post('campaigns/{campaign}/removeuser')->name('campaigns.removeuser')->uses('CampaignsController@removeUser');
		Route::post('campaigns/{campaign}/setdm')->name('campaigns.setdm')->uses('CampaignsController@setDm');
		Route::delete('campaigns/{campaign}')->name('campaigns.destroy')->uses('CampaignsController@destroy');
		Route::put('campaigns/{campaign}/restore')->name('campaigns.restore')->uses('CampaignsController@restore');
	//});

});

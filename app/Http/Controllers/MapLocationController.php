<?php

namespace App\Http\Controllers;

use App\MapLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class MapLocationController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return response()->json(MapLocation::all());
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
		$map = MapLocation::create($request->all());
		return response()->json($map, 200);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\MapLocation  $mapLocation
     * @return \Illuminate\Http\Response
     */
    public function show(MapLocation $mapLocation)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\MapLocation  $mapLocation
     * @return \Illuminate\Http\Response
     */
    public function edit(MapLocation $mapLocation)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\MapLocation  $mapLocation
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, MapLocation $mapLocation)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\MapLocation  $mapLocation
     * @return \Illuminate\Http\Response
     */
    public function destroy(MapLocation $mapLocation)
    {
        //
    }
}

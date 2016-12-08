## Paths

Every path between POIs is precalculated and cached, as well all non-standard paths longer than 3 steps.

```js
Memory.paths = {
	<pathName:roomName-x-y_roomName-x-y>:
		bump: 123456789, // Last Game.time() when used. TODO: If low memory, old paths will be purged.
		path: [ // positions are in alphabetical order
			{ x:<x>, y: <y>, dir: <direction> }, // steps goes from first to second including both ends
			... ,
		],
	... ,
}
```
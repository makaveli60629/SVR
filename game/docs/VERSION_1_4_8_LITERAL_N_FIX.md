# Version 1.4.8 - Literal Newline Syntax Fix

## Error fixed
Browser reported:

`
game/modules/world_skyline.js:2351
Uncaught SyntaxError: Unexpected identifier 'n'
`

## Actual cause
A literal text token was inserted into JavaScript:

`
scene.add(mars);
 mars.userData...
`

That is not a real newline in browser JavaScript, so the parser stopped.

## Scope
- game/modules/world_skyline.js
- docs note only

## Protected
- Website/site untouched
- Reiki runtime hash-checked

## Test
https://svrpoker.com/game/?v=1-4-8-literal-n-fix

Quest boot fix from v218 modular baseline:
- removed importmap dependency
- switched all module imports to direct CDN module URLs
- replaced VRButton helper with inline XR button
- wrapped boot in async init/catch so failures show on screen
- build label set to 20260320-v218d

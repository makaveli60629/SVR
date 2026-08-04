# Boot Recovery Note

This package restores the last stable build before the controller trigger-teleport / snap-turn experiment that caused the boot issue.

Preserved:
- controller locomotion fallback baseline
- watch/store/Reiki/table improvements from the stable phase

Temporarily rolled back:
- controller trigger-teleport on release
- controller right-stick 45 degree snap turn

Next step after confirming boot:
- reintroduce controller trigger teleport in a smaller isolated pass
- then reintroduce snap-turn separately

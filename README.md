# Scarlett VR Poker - README

**An immersive VR poker experience built with A-Frame and modern web technologies.**

> ⚠️ **18+ Only** - This project is intended for adult users.

## 📋 Overview

Scarlett VR Poker is a VR-enabled poker platform featuring:
- 🥽 **VR Support** - Full A-Frame based VR environment with hand tracking
- 🎲 **Poker Game** - Authentic poker mechanics and dealer interactions
- 🌙 **Immersive Environment** - Cinematic space lobby with moon, mars, and skyline
- 📱 **Cross-Platform** - Works on desktop browsers and Meta Quest headsets
- 🎨 **Modern UI** - Purple neon aesthetic with glassmorphism design
- ⌚ **Wrist Interface** - In-game watch for control and information

## 🎯 Quick Links

- 🌐 **Live Site**: https://makaveli60629.github.io/SVR
- 📚 **Documentation**: [See docs folder]
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/makaveli60629/SVR/issues)
- 🤝 **Contribute**: [See CONTRIBUTING.md](CONTRIBUTING.md)

## 🚀 Quick Start

### Prerequisites
- **Browser**: Chrome, Firefox, or Quest Browser (for VR)
- **Device**: PC/Mac (desktop) or Meta Quest 3/Pro (VR)
- **Network**: Local or internet connection

### Running Locally

**Option 1: Python (Recommended)**
```bash
cd SVR
python -m http.server 8000
# Visit http://localhost:8000
```

**Option 2: Node.js**
```bash
npm install -g http-server
http-server SVR -p 8000
# Visit http://localhost:8000
```

**Option 3: Live Server (VS Code)**
1. Install "Live Server" extension
2. Right-click on index.html → "Open with Live Server"

### Access Different Sections
- **Public Launch Page**: `http://localhost:8000` or root `/`
- **VR Game**: `http://localhost:8000/game`
- **Site Preview**: `http://localhost:8000/site`

## 🎮 How to Play

### Desktop Controls
| Control | Action |
|---------|--------|
| `W` / `S` | Move Forward / Backward |
| `A` / `D` | Strafe Left / Right |
| **Mouse** | Look Around |
| `T` | Toggle Watch Interface |
| `←` / `→` | Change Destination |
| `F` | Teleport |
| **Scroll** | Zoom In/Out |

### VR Controls (Meta Quest)
- **Hand Tracking** - Use your hands naturally
- **Teleport** - Point and click to move
- **Watch** - Check your wrist for game info
- **Gesture Recognition** - Wave to interact

### Game Basics
1. **Enter Game** - Click "Preview Game" from launch page
2. **Approach Table** - Walk/teleport to the poker table
3. **Place Bet** - Use watch or hand gestures
4. **Play Hand** - Make decisions based on cards
5. **Win/Lose** - Receive results at round end

## 📁 Project Structure

```
SVR/
├── 📄 index.html              # Public launch page
├── 🎨 style.css              # Launch page styling
├── 🎬 matrix.js              # Matrix animation background
│
├── 🎮 game/                  # Main VR game
│   ├── index.html           # Game entry point
│   ├── modules/             # A-Frame components
│   │   ├── watch-ui.js      # Watch face rendering
│   │   ├── lobby-floor.js   # Game floor
│   │   ├── lobby-skyline.js # Background
│   │   ├── real-table-stage.js # Poker table
│   │   └── ...
│   └── assets/              # Game resources
│       ├── models/
│       ├── textures/
│       └── audio/
│
├── 🌐 site/                 # Marketing website
│   ├── index.html          # Site preview
│   ├── css/
│   ├── js/
│   └── logo.png
│
├── ⚙️ backend/              # Backend (future)
│   └── node_modules/
│
├── 📚 Documentation
│   ├── README.md (this file)
│   ├── CONTRIBUTING.md
│   ├── DEVELOPMENT.md
│   └── DEPLOYMENT.md
│
└── 📋 Config Files
    ├── .gitignore
    ├── LICENSE
    └── CNAME
```

## 🛠️ Technology Stack

### Frontend
- **A-Frame 1.4.2** - WebXR/VR framework
- **Three.js** - 3D graphics (via A-Frame)
- **Vanilla JavaScript** - Core game logic
- **CSS3** - Styling and animations

### Hosting
- **GitHub Pages** - Static hosting
- **Custom Domain** - Via CNAME
- **HTTPS** - Automatic with GitHub Pages

### Development Tools
- **Git** - Version control
- **VS Code** - Recommended editor
- **Python/Node** - Local development server

## 📦 Game Components

### A-Frame Modules

All components located in `game/modules/`:

| Module | Purpose |
|--------|---------|
| `watch-ui.js` | Renders watch face interface |
| `forearm-device.js` | VR wrist-mounted device |
| `meta-hand-materials.js` | Hand appearance |
| `moon-upgrade.js` | Moon/celestial rendering |
| `lobby-floor.js` | Game floor generation |
| `lobby-skyline.js` | Background skyline |
| `lobby-sprites.js` | Ambient effects |
| `lobby-signage.js` | In-world signage |
| `real-table-stage.js` | Poker table & dealer |
| `floating-logo.js` | Animated logo |

### Assets

**Models** (`game/assets/models/`)
- `table.glb` - Poker table 3D model

**Textures** (`game/assets/textures/`)
- `logo.png` - Game logo
- `moon_final_diffuse.png` - Moon surface
- `moon_final_bump.png` - Moon bump map
- `tablefelt.png` - Table texture

## 🌍 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Quest |
|---------|--------|---------|--------|-------|
| Desktop | ✅ | ✅ | ⚠️ | - |
| VR Mode | ✅ | ✅ | ❌ | ✅ |
| Hand Tracking | ✅ | ✅ | ❌ | ✅ |
| Performance | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

**Notes**:
- VR requires HTTPS or localhost
- Hand tracking requires compatible device
- Safari has limited WebXR support
- Chrome recommended for best performance

## 🎨 Design System

### Color Palette

```css
--bg: #050505              /* Deep black background */
--panel: rgba(14, 14, 18, 0.94)  /* Semi-transparent panels */
--border: rgba(185, 90, 255, 0.28) /* Purple borders */
--text: #f3ecff            /* Light purple text */
--muted: #b9a9d6           /* Muted text */
--accent: #b95aff          /* Purple accent */
--accent-2: #7a2cff        /* Deep purple */
--glow: rgba(185, 90, 255, 0.35) /* Glow effects */
--danger: #ff9f9f          /* Error color */
```

### Typography

- **Font**: Arial, Helvetica, sans-serif
- **Sizes**: Responsive (clamp for fluid scaling)
- **Weights**: 400 (regular), 700 (bold), 800 (extra bold)

## 🔧 Development

### Setting Up for Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup.

**Quick setup**:
```bash
git clone https://github.com/makaveli60629/SVR.git
cd SVR
python -m http.server 8000
```

### Creating New Components

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed examples.

Basic template:
```javascript
AFRAME.registerComponent('my-component', {
  schema: {
    // Define properties
  },
  init: function() {
    // Initialize
  },
  update: function() {
    // React to changes
  }
});
```

### Testing

**Manual checklist before PR**:
- [ ] Desktop browser (Chrome, Firefox)
- [ ] Mobile responsive
- [ ] VR mode (if applicable)
- [ ] No console errors
- [ ] Performance smooth (60 FPS)

**Performance target**: 60 FPS with consistent frame time

## 📊 Deployment

### Live Deployment

Site is automatically deployed to GitHub Pages on push to `main`.

**Process**:
```
Push to main → GitHub Actions → Deploy to gh-pages → Live ✨
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Custom Domain

Custom domain configured via `CNAME` file. Point your domain's DNS to:
```
makaveli60629.github.io
```

## 🐛 Troubleshooting

### VR Not Working
- ✅ Ensure browser supports WebXR (Chrome/Firefox recommended)
- ✅ Check HTTPS (VR requires secure context)
- ✅ Verify "Enter VR" button appears
- ✅ Check browser console for errors

### Assets Not Loading
- ✅ Verify asset paths are correct
- ✅ Check browser network tab for 404 errors
- ✅ Ensure server allows CORS headers
- ✅ Try clearing browser cache

### Performance Issues
- ✅ Lower browser resolution
- ✅ Disable VR mode to test desktop
- ✅ Check DevTools Performance tab
- ✅ Monitor memory usage

### Hand Tracking Not Working
- ✅ Ensure device has hand tracking (Meta Quest 2+)
- ✅ Calibrate hand tracking in device settings
- ✅ Check browser permissions
- ✅ Try reconnecting headset

## 📚 Resources

### Learning
- [A-Frame Documentation](https://aframe.io/docs/)
- [Three.js Manual](https://threejs.org/manual/)
- [WebXR Best Practices](https://immersive-web.github.io/)
- [MDN WebGL Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)

### Tools
- [Babylon.js Playground](https://www.babylonjs-playground.com/)
- [Three.js Editor](https://threejs.org/editor/)
- [Spline 3D Designer](https://spline.design/)

### Communities
- [A-Frame Community](https://aframe.io/community/)
- [WebXR Community Group](https://www.w3.org/community/immersive-web/)
- [Stack Overflow: aframe tag](https://stackoverflow.com/questions/tagged/aframe)

## 🚀 Roadmap

**Phase 1: Foundation** ✅
- [x] VR lobby environment
- [x] Hand tracking support
- [x] Public launch page

**Phase 2: Gameplay** 🔄
- [ ] Multiplayer poker mechanics
- [ ] Real hand ranking algorithm
- [ ] Betting system
- [ ] Dealer AI

**Phase 3: Backend** 📋
- [ ] Node.js API server
- [ ] Database (MongoDB/PostgreSQL)
- [ ] Authentication system
- [ ] Player profiles & statistics

**Phase 4: Social Features** 🎯
- [ ] Tournament system
- [ ] Leaderboards
- [ ] Chat & messaging
- [ ] Player achievements

**Phase 5: Monetization** 💰
- [ ] Payment integration
- [ ] Cashier system
- [ ] Deposit/withdrawal
- [ ] Bonus system

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Read [CONTRIBUTING.md](CONTRIBUTING.md)
3. Create a feature branch
4. Make your changes
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

## 👤 Author

**makaveli60629**
- GitHub: [@makaveli60629](https://github.com/makaveli60629)
- Repository: [SVR](https://github.com/makaveli60629/SVR)

## 📞 Support

### Getting Help
1. Check existing [GitHub Issues](https://github.com/makaveli60629/SVR/issues)
2. Search [Stack Overflow](https://stackoverflow.com/questions/tagged/aframe)
3. Review [A-Frame Docs](https://aframe.io/docs/)
4. Create a new issue with details

### Bug Reports
- Describe the issue clearly
- Include browser/device info
- Provide console errors
- Steps to reproduce

### Feature Requests
- Explain the use case
- Suggest implementation approach
- Link related issues

## 🎉 Acknowledgments

Built with:
- **A-Frame** - Awesome WebXR framework
- **Three.js** - Powerful 3D library
- **GitHub** - Version control & hosting
- **Meta** - WebXR specifications

## 📈 Statistics

- **Language**: JavaScript 81.5%, HTML 12.3%, CSS 3.3%, PowerShell 2.9%
- **Repository Size**: ~3.6 MB
- **Last Updated**: 2026-05-06
- **Stars**: ⭐ Community-driven

---

**Ready to join the VR revolution?** 🚀 Visit the [live site](https://makaveli60629.github.io/SVR) and start playing!

For developers, check out [DEVELOPMENT.md](DEVELOPMENT.md) to get started building with SVR.

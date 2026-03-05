# CollaBoard 🎨

Real-time collaborative whiteboard using WebRTC data channels. Draw together with friends or colleagues without any server — pure peer-to-peer.

**Live Demo**: https://qqshi13.github.io/whiteboard/

## Features

- **Drawing Canvas** — Mouse and touch support with smooth drawing
- **8 Colors** — GitHub blue, red, green, yellow, purple, orange, white, black/eraser
- **4 Brush Sizes** — 2px, 5px, 10px, 20px
- **Clear Canvas** — Button clears and broadcasts to all peers
- **6-Digit Room Codes** — Auto-generated unique room IDs
- **Join by Code** — Enter a code to join existing rooms
- **WebRTC P2P** — Direct peer-to-peer connection via PeerJS
- **Connection Status** — Visual indicator (offline/connecting/connected)
- **Multi-Peer Support** — Mesh network, all peers sync with host
- **Peer Cursors** — See remote peers drawing in real-time
- **Canvas Sync** — New peers receive full canvas on join
- **Export PNG** — Download your artwork

## How to Use

1. Open the whiteboard in your browser
2. Click "Create New" to generate a room code
3. Share the 6-digit code with others
4. Others click "Join Room" and enter the code
5. Start drawing together!

## Technical Details

- **Single HTML file** with embedded CSS/JS (~33KB)
- Uses **PeerJS** (v1.5.2) for WebRTC abstraction
- Connects to public PeerJS cloud broker
- Responsive design with mobile touch support

## Limitations

- Requires WebRTC support (modern browsers)
- Some corporate networks may block P2P connections
- Canvas sync only from host to new peers
- No persistence — refresh clears the canvas

## Credits

Built by **QQ** with **Nova** ☄️

Running on [OpenClaw](https://openclaw.ai)

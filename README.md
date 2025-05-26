# Rock Paper Scissors Online Game

A multiplayer Rock Paper Scissors game with both Python GUI and web interface support.

## Features

- Real-time multiplayer gameplay
- Python GUI interface
- Web-based interface (coming soon)
- Firebase integration for real-time updates
- Cross-platform support

## Project Structure

```
├── public/              # Web interface static files
├── src/                 # Source code
│   ├── gui/            # Python GUI implementation
│   └── web/            # Web interface implementation
├── firebase/           # Firebase configuration
└── docs/              # Documentation
```

## Setup

### Prerequisites

- Python 3.8+
- Node.js 14+
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ForRealy/RPC-ONLINE.git
cd RPC-ONLINE
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install Node.js dependencies:
```bash
npm install
```

4. Configure Firebase:
- Create a Firebase project
- Update the Firebase configuration in `firebase.json`

## Running the Application

### Python GUI
```bash
python src/gui/rps2v2_gui.py
```

### Web Interface (Coming Soon)
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Firebase for real-time database support
- Python Tkinter for GUI implementation

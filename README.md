# Rock Paper Scissors Multiplayer Game

A real-time multiplayer Rock Paper Scissors game built with React, Firebase, and Tailwind CSS.

## Features

- 🔐 Secure authentication with email verification
- 🎮 Real-time multiplayer gameplay
- 🎯 Interactive game interface with animations
- 📱 Responsive design
- 🔄 Play again functionality
- 👥 Opponent matching system
- 🎨 Modern UI with smooth transitions
- 🔔 Real-time notifications

## Tech Stack

- React
- Firebase (Authentication & Realtime Database)
- Tailwind CSS
- React Router
- React Confetti

## Setup

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=your_database_url
```

4. Start the development server
```bash
npm run dev
```

## Game Flow

1. **Registration & Login**
   - Users can register with email/password or Google
   - Email verification required before login
   - Password reset functionality available

2. **Game Play**
   - Automatic opponent matching
   - Real-time game state updates
   - Visual feedback for choices
   - Win/lose/tie animations
   - Play again option

3. **Security**
   - Email verification required
   - Protected routes
   - Secure Firebase rules

## Recent Updates

- Added email verification before account creation
- Improved game UI with animations and transitions
- Added confetti animation for wins
- Enhanced opponent matching system
- Added real-time notifications
- Improved error handling
- Added loading states and feedback
- Enhanced mobile responsiveness

## Attributions

### Icons and Images
- Game icons (rock, paper, scissors) from [Source Name]
- Confetti animation from [react-confetti](https://github.com/alampros/react-confetti)

### Libraries
- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [React Confetti](https://github.com/alampros/react-confetti)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors
- Inspired by classic Rock Paper Scissors
- Built with modern web technologies

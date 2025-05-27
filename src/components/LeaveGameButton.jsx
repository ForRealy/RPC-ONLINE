import React from 'react'

export default function LeaveGameButton({ onClick, gameState }) {
  const getButtonText = () => {
    switch (gameState) {
      case 'waiting':
        return 'Cancel Search'
      case 'playing':
        return 'Leave Game'
      case 'finished':
        return 'Leave Game'
      default:
        return 'Leave Game'
    }
  }

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
    >
      {getButtonText()}
    </button>
  )
} 
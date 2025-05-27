import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../config/firebase'
import { ref, set, onValue, remove, query, orderByChild, equalTo, get, update, serverTimestamp } from 'firebase/database'

const CHOICES = ['rock', 'paper', 'scissors']

export default function Game() {
  const [gameState, setGameState] = useState('waiting') // waiting, playing, finished
  const [playerChoice, setPlayerChoice] = useState(null)
  const [opponentChoice, setOpponentChoice] = useState(null)
  const [result, setResult] = useState(null)
  const [gameId, setGameId] = useState(null)
  const [opponentName, setOpponentName] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [wantsToPlayAgain, setWantsToPlayAgain] = useState(false)
  const [opponentWantsToPlayAgain, setOpponentWantsToPlayAgain] = useState(false)
  const [opponentLeft, setOpponentLeft] = useState(false)
  const gameInitialized = useRef(false)
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const findOrCreateGame = useCallback(async () => {
    if (!currentUser || isSearching || gameInitialized.current) return

    setIsSearching(true)
    try {
      // Try to find a waiting game
      const gamesRef = ref(database, 'games')
      const waitingGamesQuery = query(
        gamesRef,
        orderByChild('status'),
        equalTo('waiting')
      )

      const snapshot = await get(waitingGamesQuery)
      let gameToJoin = null

      // Find a game that doesn't have the current player and is not full
      snapshot.forEach((gameSnapshot) => {
        const game = gameSnapshot.val()
        const playerCount = Object.keys(game.players || {}).length
        if (playerCount === 1 && !game.players[currentUser.uid]) {
          gameToJoin = { id: gameSnapshot.key, ...game }
        }
      })

      if (gameToJoin) {
        // Join existing game
        const gameRef = ref(database, `games/${gameToJoin.id}`)
        await update(gameRef, {
          [`players/${currentUser.uid}`]: {
            choice: null,
            ready: false,
            name: currentUser.email,
            wantsToPlayAgain: false
          },
          status: 'playing',
          updatedAt: serverTimestamp()
        })
        setGameId(gameToJoin.id)
        gameInitialized.current = true
      } else {
        // Create new game
        const newGameRef = ref(database, 'games/' + Date.now())
        await set(newGameRef, {
          players: {
            [currentUser.uid]: {
              choice: null,
              ready: false,
              name: currentUser.email,
              wantsToPlayAgain: false
            }
          },
          status: 'waiting',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        setGameId(newGameRef.key)
        gameInitialized.current = true
      }
    } catch (error) {
      console.error('Error in findOrCreateGame:', error)
    } finally {
      setIsSearching(false)
    }
  }, [currentUser, isSearching])

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    // Only initialize game if we're not navigating away
    const isNavigating = window.location.pathname !== '/game'
    if (!gameInitialized.current && !opponentLeft && !isNavigating && gameState === 'waiting') {
      findOrCreateGame()
    }

    // Listen for game updates
    if (gameId) {
      const gameRef = ref(database, `games/${gameId}`)
      const unsubscribe = onValue(gameRef, (snapshot) => {
        const game = snapshot.val()
        if (!game) {
          // Reset state but don't automatically start a new game
          setGameId(null)
          setGameState('waiting')
          gameInitialized.current = false
          setPlayerChoice(null)
          setOpponentChoice(null)
          setResult(null)
          setOpponentName(null)
          setWantsToPlayAgain(false)
          setOpponentWantsToPlayAgain(false)
          setOpponentLeft(false)
          setIsSearching(false)
          return
        }

        const players = game.players || {}
        const playerIds = Object.keys(players)

        // Find opponent
        const opponentId = playerIds.find(id => id !== currentUser.uid)
        
        if (opponentId) {
          setOpponentName(players[opponentId].name)
          if (players[opponentId]?.choice) {
            setOpponentChoice(players[opponentId].choice)
          } else {
            setOpponentChoice(null)
          }
          setOpponentWantsToPlayAgain(players[opponentId]?.wantsToPlayAgain || false)
          setOpponentLeft(false)
          setGameState(game.status)
        } else if (gameState === 'playing' || gameState === 'finished') {
          // Only update if we were in a game
          setOpponentName(null)
          setOpponentWantsToPlayAgain(false)
          setOpponentLeft(true)
          setGameState('finished')
        }

        // Check if both players have made their choices
        if (game.status === 'playing' &&
            playerIds.length === 2 &&
            players[currentUser.uid]?.choice &&
            players[opponentId]?.choice) {
          determineWinner(players[currentUser.uid].choice, players[opponentId].choice)
        }

        // Check if both players want to play again
        if (game.status === 'finished' && 
            players[currentUser.uid]?.wantsToPlayAgain && 
            players[opponentId]?.wantsToPlayAgain) {
          // Reset the game for both players
          const gameRef = ref(database, `games/${gameId}`)
          update(gameRef, {
            status: 'playing',
            [`players/${currentUser.uid}`]: {
              choice: null,
              ready: false,
              name: currentUser.email,
              wantsToPlayAgain: false
            },
            [`players/${opponentId}`]: {
              choice: null,
              ready: false,
              name: players[opponentId].name,
              wantsToPlayAgain: false
            },
            result: null,
            updatedAt: serverTimestamp()
          }).then(() => {
            // Reset local state after successful update
            setPlayerChoice(null)
            setOpponentChoice(null)
            setResult(null)
            setWantsToPlayAgain(false)
            setOpponentWantsToPlayAgain(false)
            setOpponentLeft(false)
          })
        }
      })

      return () => {
        unsubscribe()
      }
    }
  }, [currentUser, gameId, findOrCreateGame, gameState])

  const makeChoice = async (choice) => {
    if (!gameId || !currentUser) return

    setPlayerChoice(choice)
    const gameRef = ref(database, `games/${gameId}/players/${currentUser.uid}`)
    await update(gameRef, {
      choice,
      ready: true,
      name: currentUser.email
    })
  }

  const determineWinner = async (player1Choice, player2Choice) => {
    let result
    if (player1Choice === player2Choice) {
      result = 'tie'
    } else if (
      (player1Choice === 'rock' && player2Choice === 'scissors') ||
      (player1Choice === 'paper' && player2Choice === 'rock') ||
      (player1Choice === 'scissors' && player2Choice === 'paper')
    ) {
      result = 'win'
    } else {
      result = 'lose'
    }

    setResult(result)
    setGameState('finished')

    const gameRef = ref(database, `games/${gameId}`)
    await update(gameRef, {
      status: 'finished',
      result: result,
      updatedAt: serverTimestamp()
    })
  }

  const playAgain = async () => {
    if (!currentUser) return

    // If opponent left or no game, start a new game
    if (opponentLeft || !gameId) {
      // Remove the current game if it exists
      if (gameId) {
        const gameRef = ref(database, `games/${gameId}`)
        await remove(gameRef).catch(error => console.error("Error removing game:", error))
      }

      // Reset all state
      setGameId(null)
      setPlayerChoice(null)
      setOpponentChoice(null)
      setResult(null)
      setGameState('waiting')
      setOpponentName(null)
      setWantsToPlayAgain(false)
      setOpponentWantsToPlayAgain(false)
      setOpponentLeft(false)
      gameInitialized.current = false

      // Start a new game
      findOrCreateGame()
      return
    }

    // Mark that this player wants to play again
    const gameRef = ref(database, `games/${gameId}/players/${currentUser.uid}`)
    await update(gameRef, {
      wantsToPlayAgain: true,
      choice: null,
      ready: false
    })
    setWantsToPlayAgain(true)
  }

  const leaveGame = async () => {
    if (!gameId || !currentUser) return

    // First navigate to menu to prevent any game initialization
    navigate('/')

    // Then handle the cleanup
    const playerRef = ref(database, `games/${gameId}/players/${currentUser.uid}`)
    await remove(playerRef).catch(error => console.error("Error removing player:", error))

    // Check if there are any players left
    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)
    const game = snapshot.val()
    
    // If no players left, remove the game
    if (!game || !game.players || Object.keys(game.players).length === 0) {
      await remove(gameRef).catch(error => console.error("Error removing game:", error))
    }

    // Reset all state
    setGameId(null)
    setPlayerChoice(null)
    setOpponentChoice(null)
    setResult(null)
    setGameState('waiting')
    setOpponentName(null)
    setWantsToPlayAgain(false)
    setOpponentWantsToPlayAgain(false)
    setOpponentLeft(false)
    gameInitialized.current = false
    setIsSearching(false)
  }

  // Handle player leaving the game gracefully
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (gameId && currentUser) {
        // Remove the current player from the game
        const playerRef = ref(database, `games/${gameId}/players/${currentUser.uid}`)
        await remove(playerRef).catch(error => console.error("Error removing player on unload:", error))

        // Check if there are any players left
        const gameRef = ref(database, `games/${gameId}`)
        const snapshot = await get(gameRef)
        const game = snapshot.val()
        
        // If no players left, remove the game
        if (!game || !game.players || Object.keys(game.players).length === 0) {
          await remove(gameRef).catch(error => console.error("Error removing game on unload:", error))
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [gameId, currentUser])

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Rock Paper Scissors</h2>
                  <button
                    onClick={leaveGame}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Leave Game
                  </button>
                </div>

                {gameState === 'waiting' && !opponentName && (
                  <div className="text-center">
                    <p>Waiting for opponent...</p>
                  </div>
                )}

                {gameState === 'playing' && !playerChoice && (
                  <div className="space-y-4">
                    <p className="text-center">Make your choice:</p>
                    {opponentName && <p className="text-center">Playing against: {opponentName}</p>}
                    <div className="flex justify-center space-x-4">
                      {CHOICES.map((choice) => (
                        <button
                          key={choice}
                          onClick={() => makeChoice(choice)}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {gameState === 'playing' && playerChoice && (
                  <div className="text-center">
                    <p>Waiting for opponent's choice...</p>
                    <p>Your choice: {playerChoice}</p>
                    {opponentName && <p>Opponent: {opponentName}</p>}
                  </div>
                )}

                {gameState === 'finished' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p>Your choice: {playerChoice}</p>
                      <p>Opponent's choice: {opponentChoice}</p>
                      <p className="text-xl font-bold">
                        {result === 'win' && 'You won!'}
                        {result === 'lose' && 'You lost!'}
                        {result === 'tie' && "It's a tie!"}
                      </p>
                      {!opponentName && <p className="text-red-500">Opponent has left the game</p>}
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={playAgain}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        {wantsToPlayAgain ? 'Waiting for opponent to accept...' : 
                         opponentWantsToPlayAgain ? 'Opponent wants to play again!' : 
                         'Play Again'}
                      </button>
                      <button
                        onClick={leaveGame}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Leave Game
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
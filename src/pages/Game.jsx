import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../config/firebase'
import {
  ref,
  set,
  onValue,
  remove,
  query,
  orderByChild,
  equalTo,
  get,
  update,
  serverTimestamp
} from 'firebase/database'
import LeaveGameButton from '../components/LeaveGameButton'

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
  const [notification, setNotification] = useState('')
  const [displayPlayerChoice, setDisplayPlayerChoice] = useState(null)
const [displayOpponentChoice, setDisplayOpponentChoice] = useState(null)


  const findOrCreateGame = useCallback(async () => {
    if (!currentUser || isSearching || gameInitialized.current) return

    setIsSearching(true)
    try {
      const gamesRef = ref(database, 'games')
      const waitingGamesQuery = query(
        gamesRef,
        orderByChild('status'),
        equalTo('waiting')
      )

      const snapshot = await get(waitingGamesQuery)
      let gameToJoin = null

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
        const timestamp = Date.now().toString()
        const newGameRef = ref(database, `games/${timestamp}`)
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
        setGameId(timestamp)
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
    if (
      !gameInitialized.current &&
      !opponentLeft &&
      !isNavigating &&
      gameState === 'waiting'
    ) {
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
        const opponentId = playerIds.find(
          (id) => id !== currentUser.uid
        )

        if (opponentId) {
          setOpponentName(players[opponentId].name)
          if (players[opponentId]?.choice) {
            setOpponentChoice(players[opponentId].choice)
          } else {
            setOpponentChoice(null)
          }
          setOpponentWantsToPlayAgain(
            players[opponentId]?.wantsToPlayAgain || false
          )
          setOpponentLeft(false)
          setGameState(game.status)
        } else if (
          gameState === 'playing' ||
          gameState === 'finished'
        ) {
          // Opponent left mid-game
          setOpponentName(null)
          setOpponentWantsToPlayAgain(false)
          setOpponentLeft(true)
          setGameState('finished')
          setNotification('Opponent has left the game')
          setTimeout(() => setNotification(''), 3000)
        }

        // If both players made choices, compute winner
        if (
          game.status === 'playing' &&
          playerIds.length === 2 &&
          players[currentUser.uid]?.choice &&
          players[opponentId]?.choice
        ) {
          determineWinner(
            players[currentUser.uid].choice,
            players[opponentId].choice
          )
        }

        // If both players want to play again, reset state on server
        if (
          game.status === 'finished' &&
          players[currentUser.uid]?.wantsToPlayAgain &&
          players[opponentId]?.wantsToPlayAgain
        ) {
          const resetRef = ref(database, `games/${gameId}`)
          update(resetRef, {
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
            // Now that Firebase has reset the game, clear local state:
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
  }, [
    currentUser,
    gameId,
    findOrCreateGame,
    gameState,
    opponentLeft,
    navigate
  ])

  const makeChoice = async (choice) => {
    if (!gameId || !currentUser) return

    setPlayerChoice(choice)
    const playerRef = ref(
      database,
      `games/${gameId}/players/${currentUser.uid}`
    )
    await update(playerRef, {
      choice,
      ready: true,
      name: currentUser.email
    })
  }

  const determineWinner = async (player1Choice, player2Choice) => {
  let resultValue
  if (player1Choice === player2Choice) {
    resultValue = 'tie'
  } else if (
    (player1Choice === 'rock' && player2Choice === 'scissors') ||
    (player1Choice === 'paper' && player2Choice === 'rock') ||
    (player1Choice === 'scissors' && player2Choice === 'paper')
  ) {
    resultValue = 'win'
  } else {
    resultValue = 'lose'
  }

  setResult(resultValue)
  setGameState('finished')

  // Capture last choices for display
  setDisplayPlayerChoice(player1Choice)
  setDisplayOpponentChoice(player2Choice)

  const gameRef = ref(database, `games/${gameId}`)
  await update(gameRef, {
    status: 'finished',
    result: resultValue,
    updatedAt: serverTimestamp()
  })
}


  const playAgain = async () => {
    if (!currentUser) return

    // If opponent left or no game, start a fresh search
    if (opponentLeft || !gameId) {
      if (gameId) {
        const gameRef = ref(database, `games/${gameId}`)
        await remove(gameRef).catch((error) =>
          console.error('Error removing game:', error)
        )
      }
      setGameId(null)
 
      
      setGameState('waiting')
      setOpponentName(null)
      setWantsToPlayAgain(false)
      setOpponentWantsToPlayAgain(false)
      setOpponentLeft(false)
      gameInitialized.current = false
      findOrCreateGame()
      return
    }

    // In a normal “play again” scenario, just clear the result text.
    // We leave the last‐round images visible until the server flips us back to "playing."
    setResult(null)

    const playerRef = ref(database, `games/${gameId}/players/${currentUser.uid}`)
  await update(playerRef, {
    wantsToPlayAgain: true,
    choice: null,
    ready: false
  })
  setWantsToPlayAgain(true)
}

  const leaveGame = async () => {
    if (!gameId || !currentUser) return

    navigate('/')

    const playerRef = ref(
      database,
      `games/${gameId}/players/${currentUser.uid}`
    )
    await remove(playerRef).catch((error) =>
      console.error('Error removing player:', error)
    )

    const gameRef = ref(database, `games/${gameId}`)
    const snapshot = await get(gameRef)
    const gameData = snapshot.val()
    if (!gameData || !gameData.players || 
        Object.keys(gameData.players).length === 0) {
      await remove(gameRef).catch((error) =>
        console.error('Error removing game:', error)
      )
    }

    // Reset all local state
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

  // Handle “tab closed” cleanup
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (gameId && currentUser) {
        const playerRef = ref(
          database,
          `games/${gameId}/players/${currentUser.uid}`
        )
        await remove(playerRef).catch((error) =>
          console.error('Error removing player on unload:', error)
        )

        const gameRef = ref(database, `games/${gameId}`)
        const snapshot = await get(gameRef)
        const gameData = snapshot.val()
        if (
          !gameData ||
          !gameData.players ||
          Object.keys(gameData.players).length === 0
        ) {
          await remove(gameRef).catch((error) =>
            console.error('Error removing game on unload:', error)
          )
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
                  <h2 className="text-2xl font-bold">
                    Rock Paper Scissors
                  </h2>
                </div>

                {notification && (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
                    {notification}
                  </div>
                )}

                {gameState === 'waiting' && !opponentName && (
                  <div className="text-center space-y-4">
                    <p>Waiting for opponent...</p>
                    <LeaveGameButton
                      onClick={leaveGame}
                      gameState={gameState}
                    />
                  </div>
                )}

                {gameState === 'playing' && !playerChoice && (
                  <div className="space-y-4">
                    <p className="text-center">Make your choice:</p>
                    {opponentName && (
                      <p className="text-center">
                        Playing against: {opponentName}
                      </p>
                    )}
                    <div className="flex justify-center space-x-8">
                      {CHOICES.map((choice) => (
                        <button
                          key={choice}
                          onClick={() => makeChoice(choice)}
                          className="transform hover:scale-110 transition-all duration-300 focus:outline-none"
                        >
                          <img
                            src={`/images/${choice}.png`}
                            alt={choice}
                            className="w-24 h-24 object-contain"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `/images/${choice}.png`
                            }}
                          />
                        </button>
                      ))}
                    </div>
                    <LeaveGameButton
                      onClick={leaveGame}
                      gameState={gameState}
                    />
                  </div>
                )}

                {gameState === 'playing' && playerChoice && (
                  <div className="text-center space-y-4">
                    <p>Waiting for opponent's choice...</p>
                    <div className="flex justify-around">
                      <div className="flex flex-col items-center">
                        <p className="font-semibold">You</p>
                        <img
                          src={`/images/${playerChoice}.png`}
                          alt={playerChoice}
                          className="w-24 h-24 object-contain transform hover:scale-110 transition-all duration-300"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = `/images/${playerChoice}.png`
                          }}
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <p className="font-semibold">Opponent</p>
                        {opponentChoice && (
                          <img
                            src={`/images/${opponentChoice}.png`}
                            alt={opponentChoice}
                            className="w-24 h-24 object-contain transform hover:scale-110 transition-all duration-300"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = `/images/${opponentChoice}.png`
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <LeaveGameButton
                      onClick={leaveGame}
                      gameState={gameState}
                    />
                  </div>
                )}

                {gameState === 'finished' && (
  <div className="space-y-4">
    <div className="text-center space-y-2">
      <h3 className="text-xl font-semibold">
        Game Results
      </h3>
      <div className="flex justify-around">
        <div className="flex flex-col items-center">
          <p className="font-semibold">You</p>
          {displayPlayerChoice && (
            <img
              src={`/images/${displayPlayerChoice}.png`}
              alt={displayPlayerChoice}
              className="w-24 h-24 object-contain transform hover:scale-110 transition-all duration-300"
            />
          )}
        </div>
        <div className="flex flex-col items-center">
          <p className="font-semibold">Opponent</p>
          {displayOpponentChoice && (
            <img
              src={`/images/${displayOpponentChoice}.png`}
              alt={displayOpponentChoice}
              className="w-24 h-24 object-contain transform hover:scale-110 transition-all duration-300"
            />
          )}
        </div>
      </div>

      <p
        className={`text-2xl font-bold ${
          result === 'win'
            ? 'text-green-600'
            : result === 'lose'
            ? 'text-red-600'
            : 'text-blue-600'
        }`}
      >
        {result === 'win'
          ? 'You Won! 🎉'
          : result === 'lose'
          ? 'You Lost! 😢'
          : "It's a Tie! 🤝"}
      </p>
    </div>


                    <div className="space-y-2">
                      {wantsToPlayAgain &&
                        !opponentWantsToPlayAgain && (
                          <p className="text-center text-gray-600 mb-2">
                            Waiting for opponent to accept...
                          </p>
                        )}
                      {opponentWantsToPlayAgain &&
                        !wantsToPlayAgain && (
                          <p className="text-center text-green-600 mb-2">
                            Opponent wants to play again!
                          </p>
                        )}

                      <button
                        onClick={playAgain}
                        disabled={wantsToPlayAgain || opponentLeft}
                        className={`w-full px-4 py-2 rounded transform hover:scale-105 transition-all duration-300
                          ${
                            wantsToPlayAgain || opponentLeft
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-green-500 hover:bg-green-600'
                          } 
                          text-white font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50`}
                      >
                        {opponentLeft ? 'Opponent Left' : 'Play Again'}
                      </button>

                      <LeaveGameButton
                        onClick={leaveGame}
                        gameState={gameState}
                      />
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

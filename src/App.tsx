import { useState, useEffect } from 'react';
import './App.css';


interface Player {
  id: number;
  name: string;
  team: string;
  position: string;
}

function AuthForm({ onAuth }: { onAuth: (teamName: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? 'login' : 'register';
    const res = await fetch(`http://localhost:4000/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, password }),
    });
    const data = await res.json();
    if (data.success) {
      onAuth(teamName);
    } else {
      setError(data.error || 'Error');
    }
  };

  return (
    <div className="auth-form">
      <h2>{isLogin ? 'Sign In' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isLogin ? 'Sign In' : 'Register'}</button>
      </form>
      <button className="toggle-auth" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Create Account' : 'Already have an account? Sign In'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [authTeam, setAuthTeam] = useState<string | null>(null);

  useEffect(() => {
    fetch('src/players.json')
      .then((res) => res.json())
      .then((data) => setPlayers(data));
  }, []);

  // Position selection limits
  const positionLimits: Record<string, number> = {
    QB: 2,
    WR: 2,
    RB: 2,
    TE: 1,
  };

  // Group players by position
  const groupedPlayers = Object.keys(positionLimits).reduce((acc, pos) => {
    acc[pos] = players.filter((p) => p.position === pos);
    return acc;
  }, {} as Record<string, Player[]>);

  // Track selected players by position
  const [selectedByPosition, setSelectedByPosition] = useState<Record<string, number[]>>({
    QB: [], WR: [], RB: [], TE: []
  });

  const handlePlayerSelect = (pos: string, playerId: number) => {
    setSelectedByPosition((prev) => {
      const current = prev[pos] || [];
      if (current.includes(playerId)) {
        return { ...prev, [pos]: current.filter((id) => id !== playerId) };
      } else if (current.length < positionLimits[pos]) {
        return { ...prev, [pos]: [...current, playerId] };
      }
      return prev;
    });
  };

  // Save selected players to user's team
  const [savedTeam, setSavedTeam] = useState<Record<string, number[]>>({});
  const handleSaveTeam = async () => {
    setSavedTeam(selectedByPosition);
    await fetch('http://localhost:4000/save-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName: authTeam,
        teamPlayers: selectedByPosition,
      }),
    });
  };

  // Fetch saved team on login
  useEffect(() => {
    if (authTeam) {
      fetch(`http://localhost:4000/team/${authTeam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.teamPlayers) setSavedTeam(data.teamPlayers);
        });
    }
  }, [authTeam]);

  if (!authTeam) {
    return <AuthForm onAuth={setAuthTeam} />;
  }

  const handleLogout = () => {
    setAuthTeam(null);
    setSavedTeam({});
  };

  return (
    <div className="container">
      <h1>Fantasy College Football</h1>
      <p>
        Welcome, <b>{authTeam}</b>!
      </p>
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
      {!Object.values(savedTeam).some(arr => arr.length) ? (
        <>
          <h2>Pick Your Fantasy Team</h2>
          {Object.keys(positionLimits).map((pos) => (
            <div key={pos} className="position-group">
              <h3>{pos} ({positionLimits[pos]}):</h3>
              <div className="position-info">
                {positionLimits[pos] === 2
                  ? `Select exactly 2 players for the ${pos} position.`
                  : `Select exactly 1 player for the ${pos} position.`}
              </div>
              <ul className="player-list">
                {groupedPlayers[pos].map((player) => (
                  <li key={player.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedByPosition[pos].includes(player.id)}
                        onChange={() => handlePlayerSelect(pos, player.id)}
                        disabled={
                          !selectedByPosition[pos].includes(player.id) &&
                          selectedByPosition[pos].length >= positionLimits[pos]
                        }
                      />
                      {player.name} - {player.team}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {Object.entries(positionLimits).every(([pos, limit]) => selectedByPosition[pos].length === limit) && (
            <button className="save-btn" onClick={handleSaveTeam}>Save My Team</button>
          )}
        </>
      ) : (
        <div className="team-details">
          <h2>Your Team: {authTeam}</h2>
          <h3>Selected Players:</h3>
          <ul>
            {Object.entries(savedTeam).map(([pos, ids]) =>
              ids.map((id) => {
                const player = players.find((p) => p.id === id);
                return player ? (
                  <li key={id}>{pos}: {player.name} ({player.team})</li>
                ) : null;
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;

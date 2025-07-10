import { useState, useEffect } from 'react';
import './App.css';

interface Team {
  id: number;
  name: string;
  conference: string;
}

interface Player {
  id: number;
  name: string;
  team: string;
  position: string;
}

function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  useEffect(() => {
    fetch('src/ncaa-fbs-teams.json')
      .then((res) => res.json())
      .then((data) => setTeams(data));
    fetch('src/players.json')
      .then((res) => res.json())
      .then((data) => setPlayers(data));
  }, []);

  const teamPlayers = selectedTeam
    ? players.filter((p) => teams.find((t) => t.id === selectedTeam)?.name === p.team)
    : [];

  const handlePlayerSelect = (playerId: number) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  return (
    <div className="container">
      <h1>Fantasy College Football</h1>
      <h2>Select Your NCAA FBS Team</h2>
      <select
        value={selectedTeam ?? ''}
        onChange={(e) => {
          setSelectedTeam(Number(e.target.value));
          setSelectedPlayers([]);
        }}
      >
        <option value="">-- Choose a Team --</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name} ({team.conference})
          </option>
        ))}
      </select>
      {selectedTeam && (
        <div className="team-details">
          <h3>Selected Team:</h3>
          <p>
            {teams.find((t) => t.id === selectedTeam)?.name} (
            {teams.find((t) => t.id === selectedTeam)?.conference})
          </p>
          <h3>Players</h3>
          {teamPlayers.length > 0 ? (
            <ul className="player-list">
              {teamPlayers.map((player) => (
                <li key={player.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => handlePlayerSelect(player.id)}
                    />
                    {player.name} - {player.position}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p>No players available for this team.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

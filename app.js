const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const filePath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBToResponse = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
    player_match_id: obj.playerMatchId,
    score: obj.score,
    fours: obj.fours,
    sixes: obj.sixes,
  };
};

// API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details`;
  const playersArray = await db.all(getPlayersQuery);
  const responseArray = playersArray.map((obj) => convertDBToResponse(obj));
  response.send(responseArray);
});

// API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details
    WHERE player_id = ${playerId}`;
  const player = await db.get(getPlayerQuery);
  response.send(convertDBToResponse(player));
});

// API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `UPDATE player_details SET
    player_name = '${playerName}'
    WHERE player_id = ${playerId}`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details
  WHERE match_id = ${matchId}`;
  const match = await db.get(getMatchQuery);
  response.send(convertDBToResponse(match));
});

// API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `SELECT match_id,match,year FROM
    match_details NATURAL JOIN player_match_score
    WHERE player_id = ${playerId}`;
  const matchesArray = await db.all(getMatchesQuery);
  const responseArray = matchesArray.map((obj) => convertDBToResponse(obj));
  response.send(responseArray);
});

// API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `SELECT player_id,player_name FROM
    player_details NATURAL JOIN player_match_score
    WHERE match_id = ${matchId}`;
  const playerArray = await db.all(getPlayersQuery);
  const responseArray = playerArray.map((obj) => convertDBToResponse(obj));
  response.send(responseArray);
});

// API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoresQuery = `SELECT player_id AS playerId,player_name AS playerName,sum(score) AS totalScore,sum(fours) AS totalFours,sum(sixes) AS totalSixes FROM
    player_details NATURAL JOIN player_match_score
    WHERE player_id = ${playerId}`;
  const playerScore = await db.get(getPlayerScoresQuery);
  response.send(playerScore);
});

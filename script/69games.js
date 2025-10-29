
const fs = require('fs-extra');
const path = require('path');
const dailybonus = require('./dailybonus.js');

const DATA_PATH = path.join(__dirname, 'data', '69games.json');

async function loadGameData() {
  try {
    await fs.ensureDir(path.dirname(DATA_PATH));
    if (!await fs.pathExists(DATA_PATH)) {
      await fs.writeFile(DATA_PATH, JSON.stringify({}, null, 2));
    }
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveGameData(data) {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

const GAMES = {
  1: { name: "Coin Flip", reward: 100, xp: 10 },
  2: { name: "Dice Roll", reward: 150, xp: 15 },
  3: { name: "Lucky Number", reward: 200, xp: 20 },
  4: { name: "Slot Machine", reward: 300, xp: 30 },
  5: { name: "Roulette", reward: 250, xp: 25 },
  6: { name: "Blackjack", reward: 400, xp: 40 },
  7: { name: "Poker", reward: 500, xp: 50 },
  8: { name: "Baccarat", reward: 350, xp: 35 },
  9: { name: "Wheel of Fortune", reward: 450, xp: 45 },
  10: { name: "Scratch Card", reward: 180, xp: 18 },
  11: { name: "Bingo", reward: 220, xp: 22 },
  12: { name: "Keno", reward: 190, xp: 19 },
  13: { name: "Lotto", reward: 600, xp: 60 },
  14: { name: "Rock Paper Scissors", reward: 120, xp: 12 },
  15: { name: "Tic Tac Toe", reward: 140, xp: 14 },
  16: { name: "Chess", reward: 700, xp: 70 },
  17: { name: "Checkers", reward: 160, xp: 16 },
  18: { name: "Memory Match", reward: 170, xp: 17 },
  19: { name: "Puzzle Solve", reward: 210, xp: 21 },
  20: { name: "Word Search", reward: 130, xp: 13 },
  21: { name: "Crossword", reward: 240, xp: 24 },
  22: { name: "Trivia Quiz", reward: 280, xp: 28 },
  23: { name: "Math Challenge", reward: 260, xp: 26 },
  24: { name: "Riddle Master", reward: 230, xp: 23 },
  25: { name: "Hangman", reward: 150, xp: 15 },
  26: { name: "Anagram", reward: 180, xp: 18 },
  27: { name: "Scramble", reward: 160, xp: 16 },
  28: { name: "Connect Four", reward: 200, xp: 20 },
  29: { name: "Battleship", reward: 320, xp: 32 },
  30: { name: "Snake", reward: 190, xp: 19 },
  31: { name: "Tetris", reward: 250, xp: 25 },
  32: { name: "Pong", reward: 140, xp: 14 },
  33: { name: "Breakout", reward: 170, xp: 17 },
  34: { name: "Pac-Man", reward: 280, xp: 28 },
  35: { name: "Space Invaders", reward: 300, xp: 30 },
  36: { name: "Flappy Bird", reward: 220, xp: 22 },
  37: { name: "2048", reward: 260, xp: 26 },
  38: { name: "Candy Crush", reward: 240, xp: 24 },
  39: { name: "Sudoku", reward: 270, xp: 27 },
  40: { name: "Minesweeper", reward: 230, xp: 23 },
  41: { name: "Solitaire", reward: 180, xp: 18 },
  42: { name: "Mahjong", reward: 290, xp: 29 },
  43: { name: "Pool", reward: 310, xp: 31 },
  44: { name: "Bowling", reward: 200, xp: 20 },
  45: { name: "Darts", reward: 190, xp: 19 },
  46: { name: "Archery", reward: 210, xp: 21 },
  47: { name: "Golf", reward: 250, xp: 25 },
  48: { name: "Basketball", reward: 220, xp: 22 },
  49: { name: "Soccer", reward: 240, xp: 24 },
  50: { name: "Racing", reward: 330, xp: 33 },
  51: { name: "Fishing", reward: 180, xp: 18 },
  52: { name: "Hunting", reward: 270, xp: 27 },
  53: { name: "Farming", reward: 200, xp: 20 },
  54: { name: "Mining", reward: 290, xp: 29 },
  55: { name: "Crafting", reward: 210, xp: 21 },
  56: { name: "Cooking", reward: 190, xp: 19 },
  57: { name: "Dancing", reward: 160, xp: 16 },
  58: { name: "Singing", reward: 170, xp: 17 },
  59: { name: "Painting", reward: 230, xp: 23 },
  60: { name: "Photography", reward: 250, xp: 25 },
  61: { name: "Treasure Hunt", reward: 400, xp: 40 },
  62: { name: "Adventure Quest", reward: 450, xp: 45 },
  63: { name: "Dragon Slayer", reward: 500, xp: 50 },
  64: { name: "Zombie Survival", reward: 380, xp: 38 },
  65: { name: "Alien Invasion", reward: 420, xp: 42 },
  66: { name: "Pirate Battle", reward: 360, xp: 36 },
  67: { name: "Ninja Mission", reward: 390, xp: 39 },
  68: { name: "Wizard Duel", reward: 480, xp: 48 },
  69: { name: "Ultimate Champion", reward: 1000, xp: 100 }
};

module.exports.config = {
  name: "69games",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: false,
  aliases: ["games", "play", "gamelist"],
  description: "Play 69 different games and earn rewards!",
  usages: "69games [game number] | 69games list",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const subcmd = args[0]?.toLowerCase();

  if (!subcmd || subcmd === "list") {
    let msg = `🎮 69 GAMES AVAILABLE 🎮\n\n`;
    msg += `Play any game by typing: 69games [number]\n\n`;
    
    for (let i = 1; i <= 69; i++) {
      const game = GAMES[i];
      msg += `${i}. ${game.name} - 💰${game.reward} | ⭐${game.xp}XP\n`;
      
      if (i % 20 === 0 && i < 69) {
        msg += `\n(Type "69games list${Math.floor(i/20) + 1}" for more)`;
        break;
      }
    }
    
    return api.sendMessage(msg, threadID, messageID);
  }

  const gameNum = parseInt(subcmd);
  if (isNaN(gameNum) || gameNum < 1 || gameNum > 69) {
    return api.sendMessage("❌ Invalid game number! Use 69games list to see all games.", threadID, messageID);
  }

  const game = GAMES[gameNum];
  const gameData = await loadGameData();
  
  if (!gameData[senderID]) {
    gameData[senderID] = { gamesPlayed: {}, totalWins: 0, totalLosses: 0 };
  }
  
  if (!gameData[senderID].gamesPlayed[gameNum]) {
    gameData[senderID].gamesPlayed[gameNum] = { plays: 0, wins: 0 };
  }

  // Simple win/lose mechanic (50% chance)
  const won = Math.random() > 0.5;
  
  gameData[senderID].gamesPlayed[gameNum].plays++;
  
  if (won) {
    gameData[senderID].gamesPlayed[gameNum].wins++;
    gameData[senderID].totalWins++;
    
    // Update user stats in dailybonus
    await dailybonus.updateStats(senderID, {
      gamesPlayed: 1,
      gamesWon: 1,
      earnings: game.reward,
      xp: game.xp
    });
    
    await saveGameData(gameData);
    
    return api.sendMessage(
      `🎉 YOU WON ${game.name}! 🎉\n\n` +
      `💰 Earned: ${game.reward.toLocaleString()}\n` +
      `⭐ XP Gained: ${game.xp}\n` +
      `🏆 Your Wins: ${gameData[senderID].gamesPlayed[gameNum].wins}/${gameData[senderID].gamesPlayed[gameNum].plays}`,
      threadID, messageID
    );
  } else {
    gameData[senderID].totalLosses++;
    
    await dailybonus.updateStats(senderID, {
      gamesPlayed: 1,
      gamesWon: 0,
      earnings: 0,
      xp: Math.floor(game.xp / 2)
    });
    
    await saveGameData(gameData);
    
    return api.sendMessage(
      `😔 You lost ${game.name}\n\n` +
      `⭐ Consolation XP: ${Math.floor(game.xp / 2)}\n` +
      `💪 Try again! Your Wins: ${gameData[senderID].gamesPlayed[gameNum].wins}/${gameData[senderID].gamesPlayed[gameNum].plays}`,
      threadID, messageID
    );
  }
};

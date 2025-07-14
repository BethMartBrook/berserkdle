const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

let dailyCharCache = {
  date: null,
  character: null
};

//retrieves daily character
function getDailyChar(dateString, db, callback){
  const seed = dateString.split("-").join('');
  db.get("SELECT COUNT(*) AS count FROM characters",(err,countRow) => {
    if (err) return callback(err);
    const totalChars = countRow.count;
    const index = parseInt(seed) % totalChars;

    db.get("SELECT * FROM characters LIMIT 1 OFFSET ?",[index], (err , character) => {
      if (err) return callback(err);
      callback(null, character);
    })

  });

}

// API endpoint for character search
app.get('/api/search', (req, res) => {
  const char = req.query.q || '';
  
  const db = new sqlite3.Database('./berserkdb.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const sql = "SELECT image,name,arc,weapon FROM characters WHERE name LIKE ? ORDER BY name ASC";
    db.all(sql, [`%${char}%`], (err, rows) => {
      db.close();
      
      if (err) {
        console.error('Query error:', err.message);
        return res.status(500).json({ error: 'Query failed' });
      }
      
      res.json(rows);
    });
  });
});

//loads characte data after selected
app.get('/api/character', (req, res) => {
  const name = req.query.name || '';
  
  const db = new sqlite3.Database('./berserkdb.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const sql = "SELECT * FROM characters WHERE name == ? LIMIT 1";
    db.get(sql, [name], (err, row) => {
      db.close();
      
      if (err) {
        console.error('Query error:', err.message);
        return res.status(500).json({ error: 'Query failed' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Character not found' });
      }
      
      res.json(row);
    });
  });
});

//generates daily character for today
app.get('/api/today', (req, res) => {
  const now = new Date();
  const today = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0')
  ].join('-');

  if (dailyCharCache.date === today && dailyCharCache.character) {
    return res.json(dailyCharCache.character);
  }

  const db = new sqlite3.Database('./berserkdb.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    getDailyChar(today, db, (err, character) => {
      db.close();
      
      if (err) {
        console.error('Daily character error:', err.message);
        return res.status(500).json({ error: 'Failed to get daily character' });
      }
      
     dailyCharCache = {
      date: today,
      character: character
     }
      
      res.json(character);
    });
  });
});


// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Access your app: http://localhost:${port}/berserkdle.html`);
});



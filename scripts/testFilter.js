let characters = [];
let dailyCharCache = {
  date: null,
  character: null
};
prepared = false;

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const csvPath = path.join(__dirname,"../data/characters.csv");

fs.createReadStream(csvPath)
  .pipe(parse({ delimiter: ",", columns:true, skip_empty_lines:true}))
    .on("data", function (row) {
        characters.push(row);
    })
    .on("error", function (error) {
      console.log(error.message);
    })
    .on("end", () => {
        prepared = true;
        fetchDaily();
    });

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0; 
    }
    return hash;
  }


async function getDailyChar(){
    const now = new Date();
    const today = [now.getFullYear(),String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')].join('-');
    const seed = today.split("-").join('');
    if (dailyCharCache.date === today && dailyCharCache.character) {
        return dailyCharCache.character;
    }
    const count = characters.length;
    const index = simpleHash(seed)%count;
    return [today,characters[index]];
}



async function fetchDaily(){
    try {
        const [date,character] = await getDailyChar();
        dailyCharCache = {
            date: date,
            character: character
        }
    } catch (err) {
        console.error('Daily character error:', err.message);
    }
   

}

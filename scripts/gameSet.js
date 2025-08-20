let characters = [];
let dailyCharCache = {
  date: null,
  character: null
};
let readyPromise;

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0; 
  }
  return hash;
}

async function loadChars(){
  try{
    const charCSV = await fetch("data/characters.csv");
    if (!charCSV.ok) {
      throw new Error(`Failed to fetch CSV: ${charCSV.status} ${charCSV.statusText}`);
    }
    const csvData = await charCSV.text();
    const parsed = Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true  
    });
    if (parsed.errors && parsed.errors.length) {
      console.warn("CSV parse errors:", parsed.errors);
    }
    if (!Array.isArray(parsed.data) || parsed.data.length === 0) {
      throw new Error("Parsed CSV contains no data");
    }
    characters = parsed.data;

  }catch(err){
    console.error("no chars to load",err);
    characters = [];
  }
}

readyPromise = loadChars().catch(err => {
    console.error("Failed to load characters:", err);
});

async function ensureLoaded() {
  await readyPromise;
  if (!characters.length) {
    throw new Error("Characters not loaded");
  }
}

window.characterAPI = {
  async characterByName(name){
    if (typeof name !== "string" || !name.trim()) {
      return null; 
    }
    await readyPromise;
    return characters.find(c => c.name.toLowerCase() === name.toLowerCase());
  },

  async dailyChar(){
    await ensureLoaded();
    const now = new Date();
    const today = [now.getFullYear(),String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')].join('-');
    const seed = today.split("-").join('');
    if (dailyCharCache.date === today && dailyCharCache.character) {
        return dailyCharCache.character;
    }
    const count = characters.length;
    const index = simpleHash(seed)%count;
    dailyCharCache = {
      date: today,
      character: characters[index]
    }
    return dailyCharCache.character;
  },

  async searchByChar(name){
    await ensureLoaded();
    if (typeof name !== "string" || !name.trim()) {
      return null; 
    }
    const searchTerm = name.toLowerCase().trim();
    return characters.filter(char => char.name.toLowerCase().includes(searchTerm));
  }

}
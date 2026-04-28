console.log("SCRIPT LOADED");

// =========================
// INDEX PAGE LOGIC
// =========================
const form = document.querySelector("form");
const overlay = document.getElementById("overlay");
const overlayText = overlay?.querySelector("h1");

function typeText(element, text, speed = 50) {
  element.innerText = "";
  let i = 0;

  const interval = setInterval(() => {
    const char = text[i];

    if (char === " ") {
      element.innerHTML += "&nbsp;";
    } else {
      element.innerHTML += char;
    }

    i++;

    if (i >= text.length) clearInterval(interval);
  }, speed);
}

// only run on INDEX page
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const inputs = form.querySelectorAll("input, select");

    const playerData = {
      name: inputs[0].value,
      dob: inputs[1].value,
      height: inputs[2].value,
      weight: inputs[3].value,
      level: inputs[4].value,
      xp: 0
    };

    localStorage.setItem("playerData", JSON.stringify(playerData));
    localStorage.setItem("playerName", playerData.name);

    overlay.classList.remove("hidden");
    overlay.classList.add("show");

    typeText(overlayText, "SYSTEM ACTIVATING...", 60);

    setTimeout(() => {
      typeText(overlayText, "SYSTEM ACTIVATED", 80);
    }, 2000);

    setTimeout(() => {
      window.location.href = "quests.html";
    }, 3500);
  });
}

// =========================
// QUEST PAGE LOGIC
// =========================
document.addEventListener("DOMContentLoaded", () => {
  console.log("QUEST PAGE LOADED");

  const raw = localStorage.getItem("playerData");

  console.log("RAW STORAGE:", raw);

  if (!raw) {
    console.error("No playerData found");
    return;
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error("playerData corrupted", err);
    return;
  }

  const container = document.querySelector(".quests");
  const nameElement = document.getElementById("playerName");

  if (!container) {
    console.error("No .quests container found in HTML");
    return;
  }

  if (nameElement) {
    nameElement.innerText = data.name || "Unknown";
  }

  function getDailyKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 100000;
    }
    return hash;
  }

  function seededRandom(seed, max) {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * max);
  }


  // Quest Pool (random system)

    const questPool = {
      beginner: [
        { name: "Push-ups", min: 5, max: 10},
        { name: "Squats", min: 10, max: 25},
        { name: "Jumping jacks", min: 10, max: 20}
      ],
      intermediate: [
        { name: "Push-ups", min: 25, max: 35},
        { name: "Squats", min: 25, max: 35},
        { name: "Jumping jacks", min: 20, max: 30}
      ],
      advanced: [
        { name: "Push-ups", min: 35, max: 50},
        { name: "Squats", min: 30, max: 45},
        { name: "Jumping jacks", min: 30, max: 40}
      ]
    };

    // Level Cleaning

    const level = (data.level || "").toLowerCase();

    const pool = level.includes("beginner")
    ? questPool.beginner
    : level.includes("intermediate")
    ? questPool.intermediate
    : questPool.advanced;
    
    // random quest generator
    
    const seed = hashString(getDailyKey());
     
    let quests = [];

    const usedIndexes = new Set();

    while (quests.length < 3 && usedIndexes.size < pool.length) {

      const index = Math.floor(Math.random() * pool.length);

      if (usedIndexes.has(index)) continue;

      usedIndexes.add(index);

      const random = pool[index];

      if (!random) continue;

      const valueSeed = seededRandom(seed + index, 1000);

      const baseValue = 
        random.min + (valueSeed % (random.max - random.min + 1));

        quests.push({
          name: random.name,
          base: baseValue
        });
    }

    // Lock Quest Order (no shuffle)

    function getDailySeed() {
      const d = new Date();
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }

    function hashString(str) {
      let hash = 0;
      for (let i = 0; i <str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % 100000;
      }
      return hash;
    }

    const orderSeed = hashString(getDailySeed());

    //give each quest a stable "order value"

    quests = quests.map(q => {
      const sortValue = hashString(q.name + orderSeed);

      return {
        ...q,
        sortValue
      };
    });

    //sort once (this freezes order for the day)

    quests.sort((a, b) => a.sortValue - b.sortValue);


    // Render + XP System

    quests.forEach(q => {
      
    const div = document.createElement("div");
    div.classList.add("quest");

    div.innerHTML = `
      <span>${q.name}</span>
      <span class="status">0/${q.base}</span>
    `;

    let completed = false;

    div.addEventListener("click", () => {
      if (completed) return;

      completed = true;
      div.classList.add("completed");

      let saved = JSON.parse(localStorage.getItem("playerData"));

      saved.xp = (saved.xp || 0) + (q.base * 10);

      localStorage.setItem("playerData", JSON.stringify(saved));

      div.querySelector(".status").innerText = "Completed +XP";
    });
        container.appendChild(div);
  });

  });
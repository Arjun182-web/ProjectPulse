const fs = require("fs");
const path = require("path");

const memoryFile = path.join(__dirname, "../data/projectMemory.json");

function ensureMemoryFile() {
  const directory = path.dirname(memoryFile);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(memoryFile)) {
    fs.writeFileSync(memoryFile, "[]", "utf8");
  }
}

function getProjectMemory() {
  ensureMemoryFile();

  const data = fs.readFileSync(memoryFile, "utf8");

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveProjectMemory(analysis) {
  let memory = getProjectMemory();

  /*
   * Prevent duplicate entries when the same communication
   * is analyzed multiple times.
   */
  const existingIndex = memory.findIndex(
    (entry) =>
      entry.sourceMessage?.trim().toLowerCase() ===
      analysis.sourceMessage?.trim().toLowerCase()
  );

  const entry = {
    id:
      existingIndex >= 0
        ? memory[existingIndex].id
        : Date.now().toString(),

    createdAt:
      existingIndex >= 0
        ? memory[existingIndex].createdAt
        : new Date().toISOString(),

    updatedAt: new Date().toISOString(),

    ...analysis,
  };

  if (existingIndex >= 0) {
    // Replace the old analysis instead of creating a duplicate
    memory[existingIndex] = entry;
  } else {
    // New communication → add new memory entry
    memory.unshift(entry);
  }

  fs.writeFileSync(
    memoryFile,
    JSON.stringify(memory, null, 2),
    "utf8"
  );

  return entry;
}

module.exports = {
  getProjectMemory,
  saveProjectMemory,
};
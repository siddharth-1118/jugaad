import fs from "fs";
import path from "path";

const targetDir = "E:\\projects\\website\\ratio-d";

function searchDir(dir: string) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!file.startsWith(".") && file !== "node_modules") {
          searchDir(fullPath);
        }
      } else {
        if (file.toLowerCase().includes("stitch") || file.toLowerCase().includes("mcp")) {
          console.log("Found file matching:", fullPath);
        }
      }
    }
  } catch (e: any) {
    console.error("Error reading dir:", e.message);
  }
}

searchDir(targetDir);

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
        if (!file.startsWith(".") && file !== "node_modules" && file !== "out" && file !== ".next") {
          searchDir(fullPath);
        }
      } else {
        const ext = path.extname(file).toLowerCase();
        if (ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".py") {
          const content = fs.readFileSync(fullPath, "utf-8");
          if (content.includes("from('items')") || content.includes('from("items")') || content.includes(".from('items'") || content.includes("items")) {
            // Find matches
            const lines = content.split("\n");
            lines.forEach((line, idx) => {
              if (line.includes("from('items')") || line.includes('from("items")') || line.includes("supabase.from(")) {
                console.log(`${fullPath}:${idx + 1}: ${line.trim()}`);
              }
            });
          }
        }
      }
    }
  } catch (e: any) {
    console.error("Error reading dir:", e.message);
  }
}

searchDir(targetDir);

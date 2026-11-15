#!/usr/bin/env bash
set -euo pipefail

# Configure Workforce's own local llama.cpp service to use a previously
# downloaded GGUF model. It does NOT use an Ollama serving API.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
if [[ ! -f backend/.env ]]; then
  echo "First run: bash scripts/setup-local-workforce.sh" >&2
  exit 1
fi

MODEL_PATH="${1:-}"
if [[ -z "$MODEL_PATH" ]]; then
  MODEL_PATH="$(node <<'NODE'
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.join(os.homedir(), '.ollama', 'models');
const manifestRoot = path.join(root, 'manifests');
const candidates = [];
function explore(dir, depth=0) {
  if (depth > 7 || !fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const entry = path.join(dir, item.name);
    if (item.isDirectory()) { explore(entry, depth+1); continue; }
    if (!item.isFile()) continue;
    try {
      const manifest = JSON.parse(fs.readFileSync(entry, 'utf8'));
      for (const layer of manifest.layers || []) {
        if (layer.mediaType !== 'application/vnd.ollama.image.model' || !/^sha256:[a-f0-9]{64}$/.test(layer.digest)) continue;
        const modelFile = path.join(root, 'blobs', layer.digest.replace(':','-'));
        if (!fs.existsSync(modelFile)) continue;
        const fd = fs.openSync(modelFile,'r');
        const magic = Buffer.alloc(4);
        fs.readSync(fd,magic,0,4,0);
        fs.closeSync(fd);
        if (magic.toString() !== 'GGUF') continue;
        const size = fs.statSync(modelFile).size;
        const name = entry.slice(manifestRoot.length+1);
        candidates.push({ path:fs.realpathSync(modelFile), name, size });
      }
    } catch {}
  }
}
explore(manifestRoot);
const weights = (x) => {
  const n=x.name.toLowerCase();
  return (n.includes('qwen3') ? 10 : 0) + (n.includes('coder') ? 6 : 0) +
    (x.size <= 22e9 ? 2 : 0) + (n.includes('30b')||n.includes('27b')?3:0);
};
candidates.sort((a,b)=>weights(b)-weights(a)||b.size-a.size);
if (candidates.length) process.stdout.write(candidates[0].path);
NODE
)"
fi

if [[ -z "$MODEL_PATH" || ! -f "$MODEL_PATH" ]]; then
  echo "No existing GGUF found. Give a path to an already-downloaded GGUF:" >&2
  echo "  bash scripts/enable-local-ai.sh /absolute/path/to/model.gguf" >&2
  exit 1
fi
export WORKFORCE_SELECTED_GGUF="$(realpath "$MODEL_PATH")"
node <<'NODE'
'use strict';
const fs = require('node:fs');
const {randomBytes}=require('node:crypto');
const modelFile=process.env.WORKFORCE_SELECTED_GGUF;
const fd=fs.openSync(modelFile,'r');
const magic=Buffer.alloc(4);
fs.readSync(fd,magic,0,4,0);
fs.closeSync(fd);
if (magic.toString()!=='GGUF') throw new Error('This is not a GGUF model file.');
let env=fs.readFileSync('backend/.env','utf8');
const update=(k,v) => {
  const lines=env.split(/\r?\n/);
  const index=lines.findIndex(line=>line.startsWith(k+'='));
  if(index<0) lines.push(k+'='+v);
  else lines[index]=k+'='+v;
  env=lines.join('\n');
};
const keyRow=env.split('\n').find(line=>line.startsWith('MODEL_API_KEY=')) || '';
const localKey=keyRow.slice('MODEL_API_KEY='.length).trim() || randomBytes(32).toString('hex');
update('WORKFORCE_GGUF_PATH',modelFile);
update('MODEL_PROVIDER','local-llama-cpp');
update('MODEL_API_BASE_URL','http://model:8080/v1');
update('MODEL_API_KEY',localKey);
update('MODEL_ID','workforce-local');
update('MODEL_REQUEST_TIMEOUT_MS','600000');
update('RUNTIME_JOB_BATCH_SIZE','1');
fs.writeFileSync('backend/.env',env,{mode:0o600});
fs.chmodSync('backend/.env',0o600);
console.log('Configured Workforce to load an existing GGUF with a private local model server.');
console.log('Model size (GiB):', (fs.statSync(modelFile).size/1024**3).toFixed(1));
console.log('No model downloaded and no external inference account needed.');
NODE

echo
echo "Run these commands to start the real model, database, and employee backend:"
echo "  docker compose --env-file backend/.env --profile local-ai up -d --build"
echo "  docker compose --env-file backend/.env logs --tail 60 model"
echo "  curl -fsS http://localhost:5000/api/health"
echo
echo "Inference with large models on a CPU-only computer may be slow."

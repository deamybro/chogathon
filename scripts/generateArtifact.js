const fs = require('fs');
const path = require('path');

const abiPath = path.join(__dirname, '..', 'contracts', 'build', 'contracts_ChogArcadeVault_sol_ChogArcadeVault.abi');
const binPath = path.join(__dirname, '..', 'contracts', 'build', 'contracts_ChogArcadeVault_sol_ChogArcadeVault.bin');
const outPath = path.join(__dirname, '..', 'lib', 'web3', 'vaultArtifact.ts');

const abi = fs.readFileSync(abiPath, 'utf8').trim();
const bin = fs.readFileSync(binPath, 'utf8').trim();

const code = `export const VAULT_ABI = ${abi} as const;\n\nexport const VAULT_BYTECODE = "0x${bin}";\n`;

fs.writeFileSync(outPath, code, 'utf8');
console.log('VAULT_ARTIFACT_SUCCESS');

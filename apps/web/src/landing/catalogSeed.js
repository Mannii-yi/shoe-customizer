// The landing makes NO API calls. It primes the scene store with the frozen seed catalog from contracts/.
// Needs contracts/catalog.seed.json to exist (Dev C, Day 2) and Vite allowed to read the workspace root (Dev D confirms).
export { default } from '../../../../contracts/catalog.seed.json';

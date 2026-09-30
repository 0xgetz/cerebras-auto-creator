/** Random identity generators. */

const FIRST = [
  "James", "Olivia", "Liam", "Emma", "Noah", "Ava", "Ethan", "Sophia",
  "Lucas", "Mia", "Mason", "Isabella", "Logan", "Amelia", "Elijah", "Harper",
  "Daniel", "Ella", "Henry", "Grace", "Alexander", "Chloe", "Jack", "Zoe",
];
const LAST = [
  "Smith", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
  "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson",
  "Garcia", "Martinez", "Robinson", "Clark", "Lewis", "Walker", "Hall",
];
const COMPANY = [
  "Northwind Labs", "Vertex Systems", "Bluepeak Analytics", "Orbit Works",
  "Cedar Digital", "Lumen Retail", "Aster Group", "Brightforge",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomFullName() {
  return `${pick(FIRST)} ${pick(LAST)}`;
}

export function randomCompany() {
  return pick(COMPANY);
}

export function randomKeyName() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `key-${t}-${r}`;
}

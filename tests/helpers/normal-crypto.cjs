/* Keep existing work tests deterministic; dedicated bonus tests inject their own RNG. */
let next = 0;
module.exports = { getRandomValues(array) { for (let i = 0; i < array.length; i++) array[i] = 0x80000000 + (next++ % 100000); return array; } };

// Test the serializeForClient function
const { serializeForClient } = require('./apps/web/lib/utils.ts');

// Test object with BigInt
const testObj = {
  id: 123n,
  name: "Test",
  nested: {
    value: 456n,
    array: [789n, "string"]
  }
};

console.log("Original object:", testObj);
console.log("Serialized object:", serializeForClient(testObj));

// Test with JSON.stringify
try {
  const serialized = serializeForClient(testObj);
  const jsonString = JSON.stringify(serialized);
  console.log("JSON.stringify successful:", jsonString);
} catch (error) {
  console.error("JSON.stringify failed:", error.message);
}

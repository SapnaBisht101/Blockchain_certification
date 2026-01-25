import { ethers } from "ethers";
import dotenv from "dotenv";
import { createRequire } from "module"; // JSON import karne ke liye

dotenv.config();
const require = createRequire(import.meta.url);

// 1. ABI Load karo
const contractJSON = require("../abi.json"); // Path check karlena
const contractABI = contractJSON.abi;

// 2. Provider & Wallet Setup
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// 3. Contract Instance Banao (Read/Write dono ke liye)
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

// Export karo taaki routes me use kar sakein
export { contract, provider };
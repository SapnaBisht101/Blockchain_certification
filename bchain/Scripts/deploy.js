import hre from "hardhat";

async function main() {
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const certRegistry = await CertificateRegistry.deploy();

  await certRegistry.waitForDeployment();

  console.log("CertificateRegistry deployed to:", certRegistry.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
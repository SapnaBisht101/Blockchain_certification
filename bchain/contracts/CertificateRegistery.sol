// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {
    address public owner;

    // --- STRUCT: Ek Certificate ka Data ---
    struct CertData {
        string certificateHash; // SHA-256 Hash (Fingerprint)
        string ipfsCID;         // Recovery Link (Backup)
        string mongoIssuerId;   // MongoDB Issuer ID (Reference ke liye)
        uint256 timestamp;      // Kab issue hua
    }

    // --- MAPPING: Locker System ---
    // Key: qrCodeId (Unique String) => Value: CertData
    mapping(string => CertData) public certificates;

    // --- EVENT: Log maintain karne ke liye ---
    event CertificateIssued(
        string indexed qrCodeId, 
        string certificateHash, 
        string mongoIssuerId, 
        uint256 timestamp
    );

    // Modifier: Sirf Admin (Backend) ko allow karega
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can issue certificates");
        _;
    }

    constructor() {
        owner = msg.sender; // Deploy karne wala wallet Owner ban jayega
    }

    // --- FUNCTION 1: ISSUE CERTIFICATE (Write) ---
    function issueCertificate(
        string memory _qrCodeId, 
        string memory _certificateHash, 
        string memory _ipfsCID,
        string memory _mongoIssuerId
    ) public onlyOwner {
        // Safety Check: Kya ye ID pehle se exist karti hai?
        require(bytes(certificates[_qrCodeId].certificateHash).length == 0, "Certificate ID already exists");

        // Data Store karo
        certificates[_qrCodeId] = CertData({
            certificateHash: _certificateHash,
            ipfsCID: _ipfsCID,
            mongoIssuerId: _mongoIssuerId,
            timestamp: block.timestamp
        });

        // Event fire karo (Frontend/Logs ke liye)
        emit CertificateIssued(_qrCodeId, _certificateHash, _mongoIssuerId, block.timestamp);
    }

    // --- FUNCTION 2: VERIFY (Read) ---
    function getCertificate(string memory _qrCodeId) public view returns (CertData memory) {
        return certificates[_qrCodeId];
    }
}
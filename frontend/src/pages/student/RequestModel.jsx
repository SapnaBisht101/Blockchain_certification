import React, { useState, useEffect } from "react";
import axios from "axios";

const RequestModal = ({ show, onClose, studentId, apiBaseUrl }) => {

    const [issuerEmail, setIssuerEmail] = useState("");
    const [issuerData, setIssuerData] = useState(null);
    const [issuerId, setIssuerId] = useState("");
    const [message, setMessage] = useState("");
    const [loadingIssuer, setLoadingIssuer] = useState(false);

    useEffect(() => {
        if (!show) {
            setIssuerEmail("");
            setIssuerData(null);
            setIssuerId("");
            setMessage("");
        }
    }, [show]);

    if (!show) return null;

    const fetchIssuer = async () => {
        if (!issuerEmail) return;

        try {
            setLoadingIssuer(true);

            const res = await axios.get(
                `${apiBaseUrl}/issuer/by-email/${issuerEmail}`
            );

            setIssuerData(res.data);
            setIssuerId(res.data.id);

        } catch (err) {
            setIssuerData(null);
            setIssuerId("");
            alert("Issuer not found or not approved");
        } finally {
            setLoadingIssuer(false);
        }
    };

    const submitRequest = async () => {
        if (!issuerId) {
            alert("Please enter valid issuer email");
            return;
        }

        const wordCount = message.trim()
            ? message.trim().split(/\s+/).length
            : 0;

        if (wordCount > 100) {
            alert("Message cannot exceed 100 words");
            return;
        }

        try {
            await axios.post(`${apiBaseUrl}/student/request/create`, {
                studentId,
                issuerId,
                message,
            });

            alert("Request sent successfully!");
            onClose();
        } catch (err) {
            alert("Error sending request");
        }
    };

    const wordCount = message.trim()
        ? message.trim().split(/\s+/).length
        : 0;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-2xl">

                <h2 className="text-xl font-semibold mb-4">
                    Request Certificate
                </h2>

                {/* Issuer Email Input */}
                <div className="mb-3">
                    <label className="text-sm font-medium">
                        Issuer Email
                    </label>
                    <input
                        type="email"
                        value={issuerEmail}
                        onChange={(e) => setIssuerEmail(e.target.value)}
                        onBlur={fetchIssuer}
                        className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter issuer email"
                    />
                </div>

                {loadingIssuer && (
                    <p className="text-sm text-gray-500">
                        Fetching issuer...
                    </p>
                )}

                {/* ✅ ISSUER DETAILS AUTO SHOW */}
                {issuerData && (
                    <div className="bg-gray-50 border rounded-lg p-3 mb-3 text-sm space-y-1">
                        <p><strong>Name:</strong> {issuerData.issuerName}</p>
                        <p><strong>Title:</strong> {issuerData.issuerTitle}</p>
                        <p><strong>Institution:</strong> {issuerData.institutionName}</p>
                        <p><strong>Email:</strong> {issuerData.email}</p>
                    </div>
                )}

                {/* Message */}
                <div className="mb-3">
                    <label className="text-sm font-medium">
                        Message (Max 100 words)
                    </label>
                    <textarea
                        rows="4"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Write your message..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {wordCount}/100 words
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded-lg"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={submitRequest}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                    >
                        Send Request
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RequestModal;


const InstitutionHeader = ({ logo, name }) => (
  <div style={{ textAlign: "center", marginBottom: "25px" }}>
    <div
      style={{
        height: "90px",
        width: "90px",
        margin: "0 auto 15px auto",
        borderRadius: "10px",
        overflow: "hidden",
        border: "2px solid #1e3a8a22",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffffaa",
        backdropFilter: "blur(4px)",
      }}
    >
      {logo ? (
        <img
          src={logo}
          alt="Institution Logo"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontSize: "12px", color: "#9ca3af" }}>LOGO</span>
      )}
    </div>

    <h2
      style={{
        fontSize: "30px",
        fontWeight: "900",
        color: "#1e3a8a",
        textTransform: "uppercase",
        letterSpacing: "2px",
        margin: 0,
        fontFamily:"Time New Roman"
      }}
    >
      {name}
    </h2>
  </div>
);

const Tempelate = ({certData,qrCodeImage,qrCodeId}) => {
    console.log(qrCodeId);
    
return (
    
    <div
    id="cert-template"
    style={{
        position: "relative",
        width: "300mm",
        height: "300mm",
        padding: "18mm",
        background: "linear-gradient(135deg, #f0f7ff, #d6e8ff, #b5d4ff, #89bfff)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "Inter, Georgia, serif",
        boxShadow: "0 4px 25px rgba(0,0,0,0.15)",
        borderRadius: "8px",
        margin: "0 auto",
        boxSizing: "border-box",
    }}
    >
    {/* Outer Border */}
    <div
      style={{
          position: "absolute",
          top: "10mm",
          left: "10mm",
          right: "10mm",
          bottom: "10mm",
          border: "2px solid #1e3a8a55",
          borderRadius: "10px",
          pointerEvents: "none",
        }}
        />

    {/* Soft Inner Border */}
    <div
      style={{
          position: "absolute",
          top: "12mm",
          left: "12mm",
          right: "12mm",
          bottom: "12mm",
          border: "1px solid #1e3a8a33",
          borderRadius: "8px",
          pointerEvents: "none",
        }}
        />

    {/* Content */}
    <div
      style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
        >
      {/* HEADER */}
      <div style={{ textAlign: "center" }}>
        <InstitutionHeader
          logo={certData.logoImage}
          name={certData.institutionName}
          />

        <h1
          style={{
              fontSize: "52px",
              fontWeight: "900",
              color: "#1e3a8a",
              textTransform: "uppercase",
              letterSpacing: "6px",
              margin: "0",
            }}
            >
          {certData.certificateTitle}
        </h1>

        <div
          style={{
              width: "160px",
              height: "4px",
              margin: "12px auto",
              background: "linear-gradient(to right, #1e3a8a, #3b82f6, #1e3a8a)",
              borderRadius: "2px",
            }}
            />
      </div>

      {/* BODY */}
      <div style={{ textAlign: "center", marginTop: "10mm" }}>
        <p
          style={{
              fontSize: "20px",
              color: "#1e3a8a99",
              fontStyle: "italic",
              marginBottom: "10px",
            }}
            >
          Proudly Presented To
        </p>

        <h2
          style={{
              fontSize: "46px",
              fontWeight: "900",
              color: "#1e3a8a",
              borderBottom: "4px solid #3b82f6",
              display: "inline-block",
              padding: "0 15px 5px 15px",
              margin: "0",
              letterSpacing: "2px",
            }}
            >
          {certData.name}
        </h2>

        <p
          style={{
              fontSize: "18px",
              color: "#1e293b",
              maxWidth: "80%",
              margin: "20px auto 0 auto",
              lineHeight: "1.6",
            }}
            >
          {certData.certificateDescription}
        </p>

        <h3
          style={{
              fontSize: "30px",
              fontWeight: "800",
              marginTop: "18px",
              color: "#1e3a8a",
              textTransform: "uppercase",
              letterSpacing: "3px",
            }}
            >
          {certData.courseName}
        </h3>
      </div>

      {/* FOOTER */}
      <div>
        {/* Date */}
        <div
          style={{
              textAlign: "center",
              margin: "20px 0",
              padding: "15px 0",
              borderTop: "2px solid #1e3a8a33",
              borderBottom: "2px solid #1e3a8a33",
            }}
            >
          <p
            style={{
                fontSize: "14px",
                color: "#475569",
                marginBottom: "5px",
                textTransform: "uppercase",
                letterSpacing: "1px",
            }}
            >
            Date of Completion
          </p>
          <p
            style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "#1e3a8a",
                margin: 0,
            }}
            >
            {certData.completionDate}
          </p>
        </div>

        {/* Signature + QR */}
        <div
          style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              padding: "0 25px",
            }}
            >
          {/* Signature */}
          <div style={{ width: "35%", textAlign: "center" }}>
            <div
              style={{
                  width: "100%",
                  height: "70px",
                  borderBottom: "2px solid #1e3a8a",
                  marginBottom: "8px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  paddingBottom: "5px",
                }}
                >
              {certData.signatureImage ? (
                  <img
                  src={certData.signatureImage}
                  alt="Signature"
                  style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                    />
                ) : (
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                  SIGNATURE
                </span>
              )}
            </div>

            <p
              style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#1e3a8a",
                  marginBottom: "3px",
                }}
                >
              {certData.issuerName}
            </p>
            <p
              style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}
              >
              {certData.issuerTitle}
            </p>
          </div>

          {/* QR Code */}
          {qrCodeImage && (
              <div style={{ textAlign: "center" }}>
              <img
                src={qrCodeImage}
                alt="QR Code"
                style={{
                    width: "105px",
                    height: "105px",
                    objectFit: "contain",
                    background: "#ffffff",
                    padding: "6px",
                    border: "2px solid #1e3a8a",
                    borderRadius: "6px",
                }}
                />
              <p
                style={{
                    fontSize: "10px",
                    color: "#475569",
                    marginTop: "5px",
                }}
                >
                Scan to Verify
              </p>
            </div>
          )}
        </div>

        {/* Cert ID */}
        <div
          style={{
              textAlign: "center",
              marginTop: "10px",
              fontSize: "11px",
              color: "#475569",
              letterSpacing: "1px",
            }}
            >
          Certificate ID: {qrCodeId || "XXXX-XXXX-XXXX"}
        </div>
      </div>
    </div>
  </div>

);
}

export default Tempelate ;
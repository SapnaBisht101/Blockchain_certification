const A4_WIDTH_MM = "210mm";
const A4_HEIGHT_MM = "297mm";
const ACCENT_BLUE = "#1d5bd8";
const TEXT_DARK = "#1a2540";
const TEXT_MUTED = "#61708d";
const BORDER_LIGHT = "#b8d2ff";

const formatReadableDate = (value) => {
  if (!value) return "N/A";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const SideRule = ({ width = "28mm" }) => (
  <span
    style={{
      display: "inline-block",
      width,
      height: "1px",
      backgroundColor: BORDER_LIGHT,
    }}
  />
);

const InstitutionHeader = ({ name, qrCodeId }) => (
  <div
    style={{
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10mm",
    }}
  >
    <p
      style={{
        margin: 0,
        color: "#2b3448",
        fontSize: "11px",
        fontWeight: "500",
        letterSpacing: "2.2px",
        textTransform: "uppercase",
        fontFamily: "Inter, sans-serif",
      }}
    >
      Certificate ID: {qrCodeId || "XXXX-XXXX-XXXX"}
    </p>

    <h2
      style={{
        margin: 0,
        color: ACCENT_BLUE,
        fontSize: "23px",
        fontWeight: "700",
        lineHeight: "1.2",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        fontFamily: "Playfair Display, serif",
      }}
    >
      {name}
    </h2>
  </div>
);

const Tempelate = ({ certData, qrCodeImage, qrCodeId }) => {
  return (
    <div
      id="cert-template"
      style={{
        position: "relative",
        width: A4_WIDTH_MM,
        minWidth: A4_WIDTH_MM,
        height: A4_HEIGHT_MM,
        minHeight: A4_HEIGHT_MM,
        padding: "18mm 14mm 15mm",
        backgroundColor: "#fcfcfb",
        backgroundImage: certData.backgroundImage ? `url(${certData.backgroundImage})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "Inter, sans-serif",
        boxSizing: "border-box",
        boxShadow: "0 6px 24px rgba(15, 23, 42, 0.12)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "7mm 6mm",
          border: `1.5px solid ${"#7fadff"}`,
          borderRadius: "8px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: "9.5mm 8.5mm",
          border: `1px solid ${BORDER_LIGHT}`,
          borderRadius: "8px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <InstitutionHeader name={certData.institutionName} qrCodeId={qrCodeId} />

          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4.5mm",
              marginTop: "7mm",
            }}
          >
            <SideRule />
            <h1
              style={{
                margin: 0,
                color: TEXT_DARK,
                fontSize: "32px",
                fontWeight: "500",
                lineHeight: "1",
                textTransform: "uppercase",
                letterSpacing: "1.8px",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Certificate Of
            </h1>
            <SideRule />
          </div>

          <h1
            style={{
              margin: "4mm 0 0",
              color: ACCENT_BLUE,
              fontSize: "44px",
              fontWeight: "700",
              lineHeight: "1.05",
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontFamily: "Playfair Display, serif",
            }}
          >
            {certData.certificateTitle}
          </h1>
        </div>

        <div
          style={{
            marginTop: "28mm",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              color: TEXT_MUTED,
              fontSize: "18px",
              lineHeight: "1.2",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Proudly Presented To
          </p>

          <h2
            style={{
              margin: "6mm 0 0",
              color: TEXT_DARK,
              fontSize: "47px",
              fontWeight: "700",
              lineHeight: "1.05",
              letterSpacing: "0.3px",
              fontFamily: "Playfair Display, serif",
            }}
          >
            {certData.name}
          </h2>

          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4mm",
              marginTop: "11mm",
            }}
          >
            <SideRule width="26mm" />
            <p
              style={{
                margin: 0,
                color: ACCENT_BLUE,
                fontSize: "15px",
                lineHeight: "1",
                fontFamily: "Inter, sans-serif",
              }}
            >
              for
            </p>
            <SideRule width="26mm" />
          </div>

          <p
            style={{
              margin: "7mm 0 0",
              maxWidth: "118mm",
              color: "#303949",
              fontSize: "17px",
              lineHeight: "1.45",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {certData.certificateDescription}
          </p>

          <p
            style={{
              margin: "7mm 0 0",
              color: ACCENT_BLUE,
              fontSize: "15px",
              lineHeight: "1",
              fontFamily: "Inter, sans-serif",
            }}
          >
            in
          </p>

          <h3
            style={{
              margin: "7mm 0 0",
              color: ACCENT_BLUE,
              fontSize: "31px",
              fontWeight: "700",
              lineHeight: "1.15",
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              fontFamily: "Playfair Display, serif",
            }}
          >
            {certData.courseName}
          </h3>
        </div>

        <div style={{ marginTop: "auto", paddingTop: "18mm" }}>
          <div
            style={{
              margin: "0 6mm",
              padding: "8mm 0",
              borderTop: `1px solid ${BORDER_LIGHT}`,
              borderBottom: `1px solid ${BORDER_LIGHT}`,
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: TEXT_MUTED,
                fontSize: "14px",
                fontWeight: "500",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Date Of Completion
            </p>

            <p
              style={{
                margin: "5mm 0 0",
                color: ACCENT_BLUE,
                fontSize: "24px",
                fontWeight: "700",
                lineHeight: "1",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {formatReadableDate(certData.completionDate)}
            </p>
          </div>

          <div
            style={{
              marginTop: "9mm",
              padding: "0 10mm",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div style={{ width: "40%", textAlign: "center" }}>
              <div
                style={{
                  height: "70px",
                  marginBottom: "7px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-end",
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
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>SIGNATURE</span>
                )}
              </div>

              <div
                style={{
                  width: "100%",
                  borderBottom: `2px solid ${ACCENT_BLUE}`,
                }}
              />

              <p
                style={{
                  margin: "8px 0 0",
                  color: ACCENT_BLUE,
                  fontSize: "18px",
                  fontWeight: "700",
                  fontFamily: "Playfair Display, serif",
                }}
              >
                {certData.issuerName}
              </p>

              <p
                style={{
                  margin: "4px 0 0",
                  color: "#374151",
                  fontSize: "13px",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {certData.issuerTitle}
              </p>
            </div>

            {qrCodeImage && (
              <div style={{ textAlign: "center" }}>
                <img
                  src={qrCodeImage}
                  alt="QR Code"
                  style={{
                    width: "96px",
                    height: "96px",
                    objectFit: "contain",
                    background: "#ffffff",
                    padding: "6px",
                    border: `2px solid ${ACCENT_BLUE}`,
                    borderRadius: "6px",
                  }}
                />

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#374151",
                    fontSize: "10px",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Scan to Verify
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tempelate;

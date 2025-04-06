const QRCode = require("qrcode");

const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    console.error("QR Code Generation Error:", error);
    return null;
  }
};

module.exports = { generateQRCode };

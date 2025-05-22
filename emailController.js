require("dotenv").config();
const nodemailer = require("nodemailer");

// Configuración del transporter con tus credenciales reales
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,    // ejemplo: tu-correo@gmail.com
    pass: process.env.EMAIL_PASS     // contraseña de aplicación
  }
});

// Función para enviar un correo de advertencia
exports.enviarCorreo = async (req, res) => {
  const { nombrePlanilla, destinatario } = req.body;

  if (!nombrePlanilla || !destinatario) {
    return res.status(400).json({ message: "❌ Faltan campos: nombrePlanilla o destinatario" });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: destinatario,
    subject: '⚠️ Alerta: Planilla no pagada',
    text: `La planilla "${nombrePlanilla}" no ha sido pagada después de 10 días de su descarga.`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "✅ Correo de alerta enviado correctamente" });
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    res.status(500).json({ message: "❌ Fallo al enviar correo", error });
  }
};

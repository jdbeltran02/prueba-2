require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const nodemailer = require("nodemailer");
const planillasRoutes = require("./routes/planillasRoutes"); // Importar rutas

const app = express();

// 🔹 Middleware para parsear JSON y datos codificados
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// 🔹 Configurar transporte de correo (puede ser usado desde otros módulos)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// 🔹 Función global para enviar correos
const sendEmail = (subject, text, to) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
};

// Exportar función global si se necesita en otros controladores
app.locals.sendEmail = sendEmail;

// 🔹 Ruta de prueba para enviar correo
app.get("/send-test-email", async (req, res) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,    // Tu correo de Gmail
    to: 'julbeltran@uniboyaca.edu.co',  // Cambia esto a un correo de prueba válido
    subject: 'julianrobotica2013@gmail.com',
    text: 'Este es un correo de prueba enviado desde Nodemailer en Node.js.',
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    res.status(200).send(`Correo de prueba enviado: ${info.response}`);
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).send('Error al enviar el correo');
  }
});

// 🔹 Rutas de la API
app.use("/api/planillas", planillasRoutes); // Aquí se utiliza la ruta

// 🔹 Ruta de prueba para verificar si el servidor está funcionando
app.get("/", (req, res) => {
  res.send("🚀 API funcionando...");
});

// 🔹 Verificar variables de entorno
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, PORT } = process.env;
if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error("❌ Faltan variables de entorno en el archivo .env");
  process.exit(1);
}

// 🔹 Crear conexión a MySQL
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 🔹 Iniciar servidor solo si la BD se conecta correctamente
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conectado a MySQL");
    connection.release();

    const serverPort = PORT || 3000;
    app.listen(serverPort, () => {
      console.log(`✅ Servidor corriendo en http://localhost:${serverPort}`);
    });
  } catch (err) {
    console.error("❌ Error conectando a la BD:", err);
    process.exit(1);
  }
})();

module.exports = pool;

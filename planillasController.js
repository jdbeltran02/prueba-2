const nodemailer = require('nodemailer');
const pool = require("../db");

// 🔹 Helper para manejar errores
const handleDbError = (res, error, defaultMessage) => {
  console.error("❌ Error en DB:", error);
  return res.status(500).json({
    error: defaultMessage,
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};

// 🔹 Configuración de Nodemailer para el envío de correos
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'julianrobotica2013@gmail.com', // Tu correo
    pass: 'tclm jujf usdf ztax' // Contraseña o contraseña de aplicación
  }
});

// Función para enviar un correo
const sendEmail = (subject, text, to) => {
  const mailOptions = {
    from: 'julbeltran@uniboyaca.edu.co',
    to: to,
    subject: subject,
    text: text
  };

  return transporter.sendMail(mailOptions);
};

// 🔹 Función para revisar pagos pendientes después de 10 días y enviar correos
const checkPagoPendienteYEnviarCorreo = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, descarga_datetime, pagado
      FROM planillas_viaje
      WHERE pagado = 'pendiente'
    `);

    rows.forEach(planilla => {
      // Verificar si han pasado más de 10 días desde la descarga
      const descargaFecha = new Date(planilla.descarga_datetime);
      const fechaActual = new Date();
      const diffTime = Math.abs(fechaActual - descargaFecha);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 10) {
        // Si el pago está pendiente y han pasado más de 10 días, enviar correo
        sendEmail(
          'Alerta: Pago Pendiente por Más de 10 Días',
          `La planilla "${planilla.nombre}" no ha sido pagada después de 10 días de descarga.`,
          'julbeltran@uniboyaca.edu.co' // Correo donde quieres recibir la alerta
        )
          .then(() => {
            console.log(`Correo enviado para la planilla ${planilla.nombre}`);
          })
          .catch((error) => {
            console.error('Error al enviar el correo: ', error);
          });
      }
    });

    res.status(200).send('Proceso de verificación y correos completado');
  } catch (error) {
    console.error('Error al verificar pagos pendientes: ', error);
    res.status(500).send('Error en la verificación de pagos');
  }
};

// 🔹 Validación de campos requeridos
const validateCreateFields = (body) => {
  const requiredFields = ["fecha", "origen", "destino", "empresa_id", "vehiculo_id", "conductor_id", "estado"];
  return requiredFields.every((field) => body[field] !== undefined && body[field] !== null && body[field] !== "");
};

// 🔹 Obtener todas las planillas
const getPlanillas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, 
        DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
        origen, destino, empresa_id, vehiculo_id, conductor_id, estado,
        COALESCE(DATE_FORMAT(carga_datetime, '%Y-%m-%d %H:%i:%s'), NULL) AS carga_datetime,
        COALESCE(DATE_FORMAT(descarga_datetime, '%Y-%m-%d %H:%i:%s'), NULL) AS descarga_datetime,
        pagado
      FROM planillas_viaje
    `);
    res.json(rows);
  } catch (error) {
    handleDbError(res, error, "Error al obtener las planillas");
  }
};

// 🔹 Obtener una planilla por ID
const getPlanillaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT id, 
        DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
        origen, destino, empresa_id, vehiculo_id, conductor_id, estado,
        COALESCE(DATE_FORMAT(carga_datetime, '%Y-%m-%d %H:%i:%s'), NULL) AS carga_datetime,
        COALESCE(DATE_FORMAT(descarga_datetime, '%Y-%m-%d %H:%i:%s'), NULL) AS descarga_datetime,
        pagado
      FROM planillas_viaje WHERE id = ?`, [id]);

    if (rows.length === 0) return res.status(404).json({ error: "Planilla no encontrada" });

    res.json(rows[0]);
  } catch (error) {
    handleDbError(res, error, "Error al obtener la planilla");
  }
};

// 🔹 Crear una nueva planilla
const createPlanilla = async (req, res) => {
  console.log("📥 Datos recibidos en /api/planillas:", req.body);
  try {
    if (!validateCreateFields(req.body)) {
      return res.status(400).json({ error: "Campos requeridos faltantes o vacíos" });
    }

    const {
      fecha, origen, destino, empresa_id, vehiculo_id, 
      conductor_id, estado, carga_datetime, descarga_datetime, pagado
    } = req.body;

    const cargaDate = carga_datetime ? new Date(carga_datetime).toISOString().slice(0, 19).replace("T", " ") : null;
    const descargaDate = descarga_datetime ? new Date(descarga_datetime).toISOString().slice(0, 19).replace("T", " ") : null;
    
    const [result] = await pool.query(
      `INSERT INTO planillas_viaje 
      (fecha, origen, destino, empresa_id, vehiculo_id, conductor_id, estado, carga_datetime, descarga_datetime, pagado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fecha, origen, destino, empresa_id, vehiculo_id, conductor_id, estado,
        cargaDate, descargaDate, pagado || "pendiente"
      ]
    );

    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    handleDbError(res, error, "Error al crear la planilla");
  }
};

// 🔹 Actualizar una planilla
const updatePlanilla = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ["fecha", "origen", "destino", "empresa_id", "vehiculo_id", "conductor_id", "estado", "carga_datetime", "descarga_datetime", "pagado"];
    const updateData = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) updateData[key] = req.body[key];
    });

    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: "Ningún campo válido para actualizar" });

    const fields = Object.keys(updateData).map((key) => `${key} = ?`).join(", ");
    const values = Object.values(updateData);

    const [result] = await pool.query(`UPDATE planillas_viaje SET ${fields} WHERE id = ?`, [...values, id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: "Planilla no encontrada" });

    res.json({ message: "Planilla actualizada", changes: result.changedRows });
  } catch (error) {
    handleDbError(res, error, "Error al actualizar la planilla");
  }
};

// 🔹 Eliminar una planilla
const deletePlanilla = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM planillas_viaje WHERE id = ?", [id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: "Planilla no encontrada" });

    res.json({ message: "Planilla eliminada", deletedId: id });
  } catch (error) {
    handleDbError(res, error, "Error al eliminar la planilla");
  }
};

module.exports = { getPlanillas, getPlanillaById, createPlanilla, updatePlanilla, deletePlanilla, checkPagoPendienteYEnviarCorreo };

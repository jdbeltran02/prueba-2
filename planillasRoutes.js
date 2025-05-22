const express = require("express");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { enviarCorreo } = require("../controllers/emailController"); // Importamos el controlador para enviar correo
const {
  getPlanillas,
  getPlanillaById,
  createPlanilla,
  updatePlanilla,
  deletePlanilla,
  checkPagoPendienteYEnviarCorreo,
} = require("../controllers/planillasController");

const router = express.Router();

// 🔹 Validar ID antes de procesar solicitudes
router.param("id", (req, res, next, id) => {
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  next();
});

// 🔹 Rutas CRUD básicas
router.get("/", asyncHandler(getPlanillas));
router.get("/:id", asyncHandler(getPlanillaById));

router.post(
  "/",
  [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("fecha").isISO8601().withMessage("Fecha inválida"),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  asyncHandler(createPlanilla)
);

router.patch("/:id", asyncHandler(updatePlanilla));
router.delete("/:id", asyncHandler(deletePlanilla));

// 🔹 Ruta para verificar si hay planillas sin pagar después de 10 días
router.post("/check-pago", asyncHandler(checkPagoPendienteYEnviarCorreo));

// 🔹 Ruta para enviar correo de alerta por planilla no pagada
router.post("/enviar-alerta", asyncHandler(enviarCorreo));

module.exports = router;

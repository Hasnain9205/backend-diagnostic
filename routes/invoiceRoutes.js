const express = require("express");
const { authenticationRole } = require("../middlewares/authenticationRole");
const {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getAllInvoices,
  getInvoiceByUserId,
  downloadPdf,
} = require("../controllers/invoiceController");

const invoiceRouter = express.Router();

invoiceRouter.post(
  "/create-invoice",
  authenticationRole(["user", "admin"]),
  createInvoice
);
invoiceRouter.get(
  "/get-invoice/:userId",
  authenticationRole(["admin", "user"]),
  getInvoiceByUserId
);
invoiceRouter.get("/all-invoice", authenticationRole(["user"]), getAllInvoices);

invoiceRouter.put(
  "/update-invoice/:invoiceId",
  authenticationRole(["admin"]),
  updateInvoice
);
invoiceRouter.delete(
  "/delete-invoice/:invoiceId",
  authenticationRole(["admin"]),
  deleteInvoice
);
invoiceRouter.get(
  "/download-pdf/:invoiceId",
  authenticationRole(["user", "admin"]),
  downloadPdf
);

module.exports = invoiceRouter;

import {
  createSupplierService,
  deleteSupplierService,
  getSupplierByIdService,
  updateSupplierService,
  getAllSuppliersService,
} from "../services/SupplierService.js";

export async function getAllSuppliers(req, res) {
  try {
    const search = req.query.search || "";
    const suppliers = await getAllSuppliersService(search);

    res.status(200).json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createSupplier(req, res) {
  try {
    const { name, phone, email, address } = req.body;
    const supplier = await createSupplierService(name, phone, email, address);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    return res.status(201).json(supplier);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
export async function updateSupplier(req, res) {
  try {
    const { name, phone, email, address } = req.body;
    const supplier = await updateSupplierService(
      req.params.id,
      name,
      phone,
      email,
      address,
    );
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    return res.status(200).json(supplier);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
export async function deleteSupplier(req, res) {
  try {
    const supplier = await deleteSupplierService(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    return res.status(200).json(supplier);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
export async function getSupplierById(req, res) {
  try {
    const supplier = await getSupplierByIdService(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    return res.status(200).json(supplier);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

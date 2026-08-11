import {
  createCategoryService,
  deleteCategoryService,
  getAllCategoryService,
  getCategoryByIdService,
  getCategoryBySlugService,
  updateCategoryService,
} from "../services/CategoryService.js";

export async function createCategory(req, res) {
  try {
    const { name } = req.body;
    const category = await createCategoryService(name);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
export async function updateCategory(req, res) {
  try {
    const { name } = req.body;
    const category = await updateCategoryService(req.params.id, name);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
export async function deleteCategory(req, res) {
  try {
    const category = await deleteCategoryService(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}


export async function getCategoryByValue(req, res) {
  try {
    const { value } = req.params;
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(String(value || ""));

    const category = isObjectId
      ? await getCategoryByIdService(value)
      : await getCategoryBySlugService(value);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function getAllCategories(req, res) {
  try {
    const category = await getAllCategoryService();
    if (!category) {
      return res.status(404).json({ message: "None category exists" });
    }
    res.status(200).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}


import prisma from '../../config/database';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { v4 as uuidv4 } from 'uuid';

export class CategoriesService {
  async getAllCategories() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        other_Category: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        CategoryField: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return categories.filter((cat: any) => !cat.parentId);
  }

  async getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        other_Category: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        CategoryField: {
          orderBy: { order: 'asc' },
        },
        Category: true,
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async createCategory(data: {
    name: string;
    nameHe: string;
    slug: string;
    description?: string;
    icon?: string;
    parentId?: string;
    order?: number;
  }) {
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictError('Category slug already exists');
    }

    const category = await prisma.category.create({
      data: {
        id: uuidv4(),
        ...data,
        updatedAt: new Date(),
      },
    });

    return category;
  }

  async updateCategory(id: string, data: Partial<{
    name: string;
    nameHe: string;
    slug: string;
    description?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }>) {
    const category = await prisma.category.update({
      where: { id },
      data,
    });

    return category;
  }

  async deleteCategory(id: string) {
    const adsCount = await prisma.ad.count({
      where: { categoryId: id },
    });

    if (adsCount > 0) {
      throw new ConflictError('Cannot delete category with existing ads');
    }

    await prisma.category.delete({
      where: { id },
    });
  }

  async addCategoryField(categoryId: string, data: {
    name: string;
    nameHe: string;
    fieldType: string;
    options?: string;
    isRequired?: boolean;
    order?: number;
  }) {
    const field = await prisma.categoryField.create({
      data: {
        id: uuidv4(),
        categoryId,
        ...data,
        updatedAt: new Date(),
      },
    });

    return field;
  }

  async updateCategoryField(fieldId: string, data: Partial<{
    name: string;
    nameHe: string;
    fieldType: string;
    options?: string;
    isRequired?: boolean;
    order?: number;
  }>) {
    const field = await prisma.categoryField.update({
      where: { id: fieldId },
      data,
    });

    return field;
  }

  async deleteCategoryField(fieldId: string) {
    await prisma.categoryField.delete({
      where: { id: fieldId },
    });
  }
}

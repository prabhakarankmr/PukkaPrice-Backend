import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as fs from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Constructs the public image URL from file name.
   */
  private getImageUrl(fileName: string): string {
    return `http://localhost:${process.env.PORT || 3001}/uploads/${fileName}`;
  }

  /**
   * Creates a new product with image file saved and URL stored in DB.
   */
  async create(createProductDto: CreateProductDto, image: any) {
    if (!image) {
      throw new Error('Image file is required');
    }

    const imageUrl = this.getImageUrl(image.filename);

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        imageUrl,
      },
    });
  }


  /**
   * Updates a product. Replaces the image if new one is uploaded.
   */
  async update(id: string, updateProductDto: UpdateProductDto, image?: any) {
    const product = await this.findOne(id);
    let imageUrl = product.imageUrl;

    if (image) {
      // Delete old image file if exists
      const oldImageName = imageUrl?.split('/').pop();
      if (oldImageName) {
        try {
          await fs.unlink(join(process.cwd(), 'uploads', oldImageName));
        } catch (error) {
          console.warn('Warning: Could not delete old image ->', error.message);
        }
      }

      // Set new image URL
      imageUrl = this.getImageUrl(image.filename);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        imageUrl,
      },
    });
  }

  /**
   * Deletes a product and removes its image file.
   */
  async remove(id: string) {
    const product = await this.findOne(id);

    const imageName = product.imageUrl?.split('/').pop();
    if (imageName) {
      try {
        await fs.unlink(join(process.cwd(), 'uploads', imageName));
      } catch (error) {
        console.warn('Warning: Could not delete image file ->', error.message);
      }
    }

    return this.prisma.product.delete({ where: { id } });
  }

  async findAll(query?: ProductQueryDto) {
    // If no query parameters, return simple list (for basic GET /products)
    if (!query || Object.keys(query).length === 0) {
      return this.prisma.product.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
    const {
      search = '',
      category,
      subCategory,
      sourceWebsite,
      deals,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = '1',
      limit = '20',
    } = query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    // Add search condition
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { SEO_title: { contains: search } },
        { META_description: { contains: search } },
      ];
    }

    // Add category filter
    if (category) {
      where.category = category;
    }

    // Add subCategory filter
    if (subCategory) {
      where.subCategory = subCategory;
    }

    // Add source website filter
    if (sourceWebsite) {
      where.sourceWebsite = sourceWebsite;
    }

    // Add deals filter
    if (deals !== undefined) {
      where.deals = deals === 'true';
    }

    // Get products and total count
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        skip,
        take: limitNum,
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          affiliateLink: true,
          SEO_title: true,
          META_description: true,
          sourceWebsite: true,
          category: true,
          subCategory: true,
          deals: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        search,
        category,
        subCategory,
        sourceWebsite,
        deals,
        sortBy,
        sortOrder,
      },
    };
  }

  /**
   * Finds a product by ID or throws an exception.
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  /**
   * Finds a product by ID and returns formatted response (for API endpoints)
   */
  async findOneFormatted(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
      },
    });

    if (!product) {
      return null;
    }

    return {
      success: true,
      data: product,
    };
  }

  async getCategories() {
    const [categories, subCategories] = await Promise.all([
      this.prisma.product.groupBy({
        by: ['category'],
        _count: {
          category: true,
        },
      }),
      this.prisma.product.groupBy({
        by: ['subCategory'],
        _count: {
          subCategory: true,
        },
      }),
    ]);

    const sourceWebsites = await this.prisma.product.groupBy({
      by: ['sourceWebsite'],
      _count: {
        sourceWebsite: true,
      },
      orderBy: {
        _count: {
          sourceWebsite: 'desc',
        },
      },
    });

    return {
      success: true,
      data: {
        categories: categories.map((item) => ({
          category: item.category,
          count: item._count.category,
        })),
        subCategories: subCategories.map((item) => ({
          subCategory: item.subCategory,
          count: item._count.subCategory,
        })),
        sourceWebsites: sourceWebsites.map((item) => ({
          sourceWebsite: item.sourceWebsite,
          count: item._count.sourceWebsite,
        })),
      },
    };
  }

  async getSearchSuggestions(query: string) {
    if (query.length < 2) {
      return {
        success: true,
        data: [],
      };
    }

    const products = await this.prisma.product.findMany({
      where: {
        title: {
          contains: query,
        },
      },
      select: {
        title: true,
      },
      distinct: ['title'],
      take: 10,
      orderBy: {
        title: 'asc',
      },
    });

    return {
      success: true,
      data: products.map((item) => item.title),
    };
  }

  async getSubcategoriesByCategory(category: string) {
    const subCategories = await this.prisma.product.groupBy({
      by: ['subCategory'],
      where: {
        category: category as any,
      },
      _count: {
        subCategory: true,
      },
      orderBy: {
        _count: {
          subCategory: 'desc',
        },
      },
    });

    return {
      success: true,
      data: subCategories.map((item) => ({
        subCategory: item.subCategory,
        count: item._count.subCategory,
      })),
    };
  }}
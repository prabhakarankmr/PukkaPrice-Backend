
    
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as fs from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ProductsService {
  getSubcategoriesByCategory(category: string) {
    throw new Error('Method not implemented.');
  }
  constructor(private prisma: PrismaService) {}

  /**
   * Constructs the public image URL from file name.
   */
  private getImageUrl(fileName: string): string {
    // Always return the full production URL for images
    return `https://api.pukkaprice.com/uploads/${fileName}`;
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
  async searchProducts(keyword: string, query?: ProductQueryDto) {
      try {
        if (!keyword) {
          return {
            success: true,
            data: [],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 0,
              itemsPerPage: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
            filters: query || {},
          };
        }

        const {
          category,
          subCategory,
          sourceWebsite,
          deals,
          sortBy = 'createdAt',
          sortOrder = 'DESC',
          page = '1',
          limit = '20',
        } = query || {};

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
          ],
        };
        if (category) {
          where.category = category;
        }
        if (subCategory) {
          where.subCategory = subCategory;
        }
        if (sourceWebsite) {
          where.sourceWebsite = sourceWebsite;
        }
        if (deals !== undefined) {
          where.deals = deals === 'true';
        }

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
            keyword,
            category,
            subCategory,
            sourceWebsite,
            deals,
            sortBy,
            sortOrder,
          },
        };
      } catch (error) {
        // Never throw a server error for a search query, always return empty array
        console.error('Search error:', error);
        return {
          success: true,
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
          filters: query || {},
        };
      }
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
    try {
      // If no query parameters, return all products
      if (!query || Object.keys(query).length === 0 || !query.search) {
        const products = await this.prisma.product.findMany({
          orderBy: { createdAt: 'desc' },
        });
        return {
          success: true,
          data: products,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: products.length,
            itemsPerPage: products.length,
            hasNextPage: false,
            hasPrevPage: false,
          },
          filters: {},
        };
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

      // Add search condition (case-insensitive, on title OR description)
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Add category filter (exact match or slug)
      if (category) {
        where.OR = where.OR || [];
        where.OR.push(
          { category: category },
          { category: category.toUpperCase() },
          { category: category.toLowerCase() },
          { category: { equals: category, mode: 'insensitive' } }
        );
      }

      if (subCategory) {
        where.subCategory = subCategory;
      }
      if (sourceWebsite) {
        where.sourceWebsite = sourceWebsite;
      }
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
    } catch (error) {
      // Never throw a server error for a search query, always return empty array
      return {
        success: true,
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        filters: query || {},
      };
    }
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
          data: products.map((p) => p.title),
        };
      }
    }
      
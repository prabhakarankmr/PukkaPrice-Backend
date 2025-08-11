import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Req,
  HttpException,
  HttpStatus,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductQueryDto, SearchSuggestionsDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { FastifyRequest } from 'fastify';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import * as path from 'path';

// Import SubCategory enum from Prisma Client
import { SubCategory } from '@prisma/client';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  getRoot() {
    return {
      message: 'PukkaPrice Backend API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        products: '/products',
        categories: '/products/categories',
        deals: '/products/deals',
        subcategories: '/products/subcategories/:category',
        search: '/products?search=keyword',
        filterByCategory: '/products?category=ELECTRONICS',
        filterBySubCategory: '/products?subCategory=SMARTPHONES',
        filterBySourceWebsite: '/products?sourceWebsite=AMAZON',
        filterByDeals: '/products?deals=true',
        suggestions: '/products/search/suggestions?q=keyword',
        singleProduct: '/products/:id',
        createProduct: 'POST /products',
        updateProduct: 'PATCH /products/:id',
        deleteProduct: 'DELETE /products/:id',
        staticFiles: '/uploads/:filename',
        // Admin CRUD endpoints
        createProductAdmin: 'POST /admin/products',
        getAllProductsAdmin: 'GET /admin/products',
        getProductAdmin: 'GET /admin/products/:id',
        updateProductAdmin: 'PATCH /admin/products/:id',
        deleteProductAdmin: 'DELETE /admin/products/:id'
      },
      documentation: 'https://github.com/your-repo/readme'
    };
  }

  @Get('products')
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('products/categories')
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Get('products/deals')
  async getDeals(@Query() query: ProductQueryDto) {
    query.deals = 'true';
    return this.productsService.findAll(query);
  }

  @Get('products/subcategories/:category')
  async getSubcategoriesByCategory(@Param('category') category: string) {
    return this.productsService.getSubcategoriesByCategory(category);
  }

  // New endpoint: GET /subcategories
  @Get('subcategories')
  getAllSubcategories() {
    // Return all subcategories from the enum
    return {
      success: true,
      data: Object.values(SubCategory),
    };
  }

  @Get('products/search/suggestions')
  async getSearchSuggestions(@Query() { q }: SearchSuggestionsDto) {
    return this.productsService.getSearchSuggestions(q || '');
  }

  @Get('products/:id')
  async findOne(@Param('id') id: string) {
    const result = await this.productsService.findOneFormatted(id);
    
    if (!result) {
      throw new NotFoundException('Product not found');
    }
    
    return result;
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Req() req: any) {
    const dtoData: Partial<UpdateProductDto> = {};
    let imageFilename: string | undefined;
  
    const parts = req.parts();
    for await (const part of parts as any) {
      if (part.file && (part.fieldname === 'image' || part.fieldname === 'file')) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  
        const filename = `${Date.now()}-${part.filename}`;
        const filepath = path.join(uploadDir, filename);
  
        await new Promise<void>((resolve, reject) => {
          const stream = createWriteStream(filepath);
          part.file.pipe(stream).on('finish', resolve).on('error', reject);
        });
  
        imageFilename = filename;
      } else if (part.fieldname) {
        // Convert string values to appropriate types
        let value = part.value;
        
        // Convert deals field to boolean
        if (part.fieldname === 'deals') {
          value = value === 'true' || value === true;
        }
        
        (dtoData as any)[part.fieldname] = value;
      }
    }
  
    const image = imageFilename ? { filename: imageFilename } as any : undefined;
    return this.productsService.update(id, dtoData as UpdateProductDto, image);
  }

  @Post('products')
  async createProduct(@Req() req: any) {
    const dtoData: Partial<CreateProductDto> = {};
    let imageFilename = '';
  
    const parts = req.parts();
    for await (const part of parts as any) {
      if (part.file && (part.fieldname === 'image' || part.fieldname === 'file')) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  
        const filename = `${Date.now()}-${part.filename}`;
        const filepath = path.join(uploadDir, filename);
  
        await new Promise<void>((resolve, reject) => {
          const stream = createWriteStream(filepath);
          part.file.pipe(stream).on('finish', resolve).on('error', reject);
        });
  
        imageFilename = filename;
      } else if (part.fieldname) {
        // Convert string values to appropriate types
        let value = part.value;
        
        // Convert deals field to boolean
        if (part.fieldname === 'deals') {
          value = value === 'true' || value === true;
        }
        
        (dtoData as any)[part.fieldname] = value;
      }
    }
  
    if (!imageFilename) {
      throw new HttpException('Image file is required', HttpStatus.BAD_REQUEST);
    }
  
    return this.productsService.create(dtoData as CreateProductDto, {
      filename: imageFilename,
    } as any);
  }

  @Delete('products/:id')
  removeProduct(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // CRUD Operations for Product Management

  @Post('admin/products')
  async create(@Req() req: any) {
    const dtoData: Partial<CreateProductDto> = {};
    let imageFilename = '';
  
    const parts = req.parts();
    for await (const part of parts as any) {
      if (part.file && (part.fieldname === 'image' || part.fieldname === 'file')) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  
        const filename = `${Date.now()}-${part.filename}`;
        const filepath = path.join(uploadDir, filename);
  
        await new Promise<void>((resolve, reject) => {
          const stream = createWriteStream(filepath);
          part.file.pipe(stream).on('finish', resolve).on('error', reject);
        });
  
        imageFilename = filename;
      } else if (part.fieldname) {
        // Convert string values to appropriate types
        let value = part.value;
        
        // Convert deals field to boolean
        if (part.fieldname === 'deals') {
          value = value === 'true' || value === true;
        }
        
        (dtoData as any)[part.fieldname] = value;
      }
    }
  
    if (!imageFilename) {
      throw new HttpException('Image file is required', HttpStatus.BAD_REQUEST);
    }
  
    return this.productsService.create(dtoData as CreateProductDto, {
      filename: imageFilename,
    } as any);
  }
  
  @Get('admin/products')
  findAllAdmin() {
    return this.productsService.findAll();
  }

  @Get('admin/products/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch('admin/products/:id')
  async update(@Param('id') id: string, @Req() req: any) {
    const dtoData: Partial<UpdateProductDto> = {};
    let imageFilename: string | undefined;
  
    const parts = req.parts();
    for await (const part of parts as any) {
      if (part.file && (part.fieldname === 'image' || part.fieldname === 'file')) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
  
        const filename = `${Date.now()}-${part.filename}`;
        const filepath = path.join(uploadDir, filename);
  
        await new Promise<void>((resolve, reject) => {
          const stream = createWriteStream(filepath);
          part.file.pipe(stream).on('finish', resolve).on('error', reject);
        });
  
        imageFilename = filename;
      } else if (part.fieldname) {
        // Convert string values to appropriate types
        let value = part.value;
        
        // Convert deals field to boolean
        if (part.fieldname === 'deals') {
          value = value === 'true' || value === true;
        }
        
        (dtoData as any)[part.fieldname] = value;
      }
    }
  
    const image = imageFilename ? { filename: imageFilename } as any : undefined;
    return this.productsService.update(id, dtoData as UpdateProductDto, image);
  }

  @Delete('admin/products/:id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

import { IsOptional, IsString, IsNumberString, IsIn, IsBoolean } from 'class-validator';

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subCategory?: string;

  @IsOptional()
  @IsString()
  sourceWebsite?: string;

  @IsOptional()
  @IsString()
  deals?: string; // Will be converted to boolean

  @IsOptional()
  @IsIn(['title', 'createdAt', 'updatedAt', 'sourceWebsite', 'category', 'subCategory'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @IsOptional()
  @IsNumberString()
  limit?: string = '20';
}

export class SearchSuggestionsDto {
  @IsOptional()
  @IsString()
  q?: string;
}

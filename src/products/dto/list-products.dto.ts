import { IsOptional, IsString } from 'class-validator';

export class ListProductsDto {
  @IsOptional()
  @IsString()
  search?: string;
}

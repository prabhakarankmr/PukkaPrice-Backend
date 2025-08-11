import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  IsBoolean,
  IsIn,
} from 'class-validator';
// Define SourceWebsite enum locally if not exported from @prisma/client
export enum SourceWebsite {
  AMAZON = 'AMAZON',
  FLIPKART = 'FLIPKART',
  // Add other source websites as needed
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsString()
  @IsOptional()
  @IsUrl()
  affiliateLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  SEO_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  META_description?: string;

  @IsEnum(SourceWebsite)
  @IsOptional()
  sourceWebsite?: SourceWebsite;

  @IsString()
  @IsOptional()
  @IsIn(['ELECTRONICS'])
  category?: 'ELECTRONICS';

  @IsString()
  @IsOptional()
  @IsIn(['SMARTPHONES', 'LAPTOPS', 'HEADPHONES_EARBUDS', 'SMARTWATCHES', 'BLUETOOTH_SPEAKERS', 'LED_SMART_TVS', 'POWER_BANKS', 'DSLR_MIRRORLESS_CAMERAS', 'MOBILE_CHARGERS_CABLES', 'HOME_THEATER_SOUNDBARS'])
  subCategory?: 'SMARTPHONES' | 'LAPTOPS' | 'HEADPHONES_EARBUDS' | 'SMARTWATCHES' | 'BLUETOOTH_SPEAKERS' | 'LED_SMART_TVS' | 'POWER_BANKS' | 'DSLR_MIRRORLESS_CAMERAS' | 'MOBILE_CHARGERS_CABLES' | 'HOME_THEATER_SOUNDBARS';

  @IsBoolean()
  @IsOptional()
  deals?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

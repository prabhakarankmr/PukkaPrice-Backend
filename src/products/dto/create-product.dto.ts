import { IsEnum, IsNotEmpty, IsString, IsUrl, MaxLength, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { SourceWebsite } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  affiliateLink: string;

  @IsString()
  @MaxLength(60)
  SEO_title: string;

  @IsString()
  @MaxLength(140)
  META_description: string;

  @IsEnum(SourceWebsite)
  @IsNotEmpty()
  sourceWebsite: SourceWebsite;

  @IsString()
  @IsOptional()
  @IsIn(['ELECTRONICS'])
  category?: 'ELECTRONICS';

  @IsString()
  @IsNotEmpty()
  @IsIn(['SMARTPHONES', 'LAPTOPS', 'HEADPHONES_EARBUDS', 'SMARTWATCHES', 'BLUETOOTH_SPEAKERS', 'LED_SMART_TVS', 'POWER_BANKS', 'DSLR_MIRRORLESS_CAMERAS', 'MOBILE_CHARGERS_CABLES', 'HOME_THEATER_SOUNDBARS'])
  subCategory: 'SMARTPHONES' | 'LAPTOPS' | 'HEADPHONES_EARBUDS' | 'SMARTWATCHES' | 'BLUETOOTH_SPEAKERS' | 'LED_SMART_TVS' | 'POWER_BANKS' | 'DSLR_MIRRORLESS_CAMERAS' | 'MOBILE_CHARGERS_CABLES' | 'HOME_THEATER_SOUNDBARS';

  @IsBoolean()
  @IsOptional()
  deals?: boolean;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class SubmitOnboardingDto {
  @ApiProperty()
  @IsNumber()
  age: number;

  @ApiProperty()
  @IsString()
  sex: string;

  @ApiProperty()
  @IsNumber()
  height: number;

  @ApiProperty()
  @IsNumber()
  weight: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty()
  @IsString()
  primaryGoal: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  goalSpecific?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  lifestyle?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  training?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  foodPreferences?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  healthInfo?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  adherence?: any;
}

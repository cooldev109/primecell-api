import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsInt, Min, Max, IsString, IsOptional, IsArray } from 'class-validator';

export class SubmitCheckinDto {
  @ApiProperty({ description: 'Current weight in kg' })
  @IsNumber()
  weight: number;

  @ApiProperty({ description: 'Waist measurement in cm', required: false })
  @IsOptional()
  @IsNumber()
  waist?: number;

  @ApiProperty({ description: 'Photo URL', required: false })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty({ description: 'Energy level (0-10)' })
  @IsInt()
  @Min(0)
  @Max(10)
  energy: number;

  @ApiProperty({ description: 'Hunger level (0-10)' })
  @IsInt()
  @Min(0)
  @Max(10)
  hunger: number;

  @ApiProperty({ description: 'Sleep quality (0-10)' })
  @IsInt()
  @Min(0)
  @Max(10)
  sleep: number;

  @ApiProperty({ description: 'Stress level (0-10)' })
  @IsInt()
  @Min(0)
  @Max(10)
  stress: number;

  @ApiProperty({ description: 'Adherence level', enum: ['100', '80-90', '60-70', '<60'] })
  @IsString()
  adherence: string;

  @ApiProperty({ description: 'Contextual events', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  events?: string[];

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Self-perception', enum: ['progressing', 'same', 'frustrated', 'unsure'] })
  @IsString()
  perception: string;
}
